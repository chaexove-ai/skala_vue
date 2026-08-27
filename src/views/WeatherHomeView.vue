<script setup>
// 과제 4-3) WeatherHomeView: 과제 3의 WeatherParent를 라우터 구조에 맞게 옮긴 메인 대시보드 화면.
// 달라진 점은 두 가지뿐이다.
//   1. 도시 데이터를 파일 안에 두지 않고 공통 Mock Data(src/data/weatherData.js)에서 가져온다.
//      → 상세 페이지가 같은 데이터를 봐야 하기 때문.
//   2. 상세보기를 카드 안에서 펼치지 않고 router.push로 상세 페이지(/weather/:cityId)로 이동한다.
// 반응형 상태를 이 화면이 모두 소유하고, 자식은 props/emits로만 통신하는 구조는 그대로다.
import { ref, reactive, computed, watch, watchEffect, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWeatherStore, MAX_EXTRA_CITIES } from '@/stores/weatherStore.js'
import { useFavoriteStore } from '@/stores/favoriteStore.js'
import { searchPlaces } from '@/api/geocodingApi.js'
import { statusMeta } from '@/data/weatherStatus.js'
import { useConfigStore } from '@/stores/configStore.js'
import { useDashboardStore } from '@/stores/dashboardStore.js'
import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'
import SearchBar from '@/components/exercise/SearchBar.vue'
import WeatherCard from '@/components/exercise/WeatherCard.vue'

const router = useRouter()
// 과제 5) 단위 설정과 대시보드 화면 상태(정렬·선택)를 스토어에서 가져온다.
const config = useConfigStore()
const dashboard = useDashboardStore()
const weather = useWeatherStore()
const favorite = useFavoriteStore()

// 화면이 열릴 때 실제 날씨를 불러온다. 이미 받아둔 게 있으면 스토어가 알아서 건너뛴다.
onMounted(() => weather.loadAll())

// "언제 받은 값인가"를 보여주기 위한 시계. 30초마다 갱신한다.
// 날씨는 시간이 지나면 낡는데, 지금까지는 화면만 보고는 방금 값인지 10분 전 값인지 알 수 없었다.
const now = ref(Date.now())
let clockId = null
onMounted(() => {
  clockId = setInterval(() => (now.value = Date.now()), 30_000)
})
onUnmounted(() => clearInterval(clockId))

const freshness = computed(() => {
  if (!weather.loadedAt) return ''
  const minutes = Math.floor((now.value - weather.loadedAt.getTime()) / 60_000)
  if (minutes < 1) return '방금 기준'
  if (minutes < 60) return `${minutes}분 전 기준`
  return `${Math.floor(minutes / 60)}시간 전 기준`
})

const refresh = async () => {
  await weather.loadAll({ force: true })
  now.value = Date.now()
  if (!weather.error) ElMessage.success('날씨를 새로 받았습니다')
}

// 서버에서 받아온 목록을 그대로 쓴다. (Mock 배열이 아니라 스토어의 상태)
const weatherList = computed(() => weather.list)

const searchQuery = ref('')
// 선택한 도시는 스토어가 id만 갖고, 화면은 그 id로 도시 객체를 찾아 쓴다.
// (스토어에 객체를 통째로 넣어두면 원본 데이터가 바뀌었을 때 옛 정보가 남는다)
const selectedCityInfo = computed(
  () => weatherList.value.find((city) => city.id === dashboard.selectedCityId) ?? null,
)

const filteredWeatherList = computed(() =>
  weatherList.value.filter((city) => city.name.includes(searchQuery.value.trim())),
)

// 즐겨찾기한 도시는 목록 위쪽에 따로 모아 보여준다.
// 토글로 "즐겨찾기만 보기"를 만들 수도 있었지만, 그러면 사용자가 모드를 껐다 켜야 하고
// 즐겨찾기가 없을 때는 비활성 버튼만 자리를 차지한다. 두 묶음을 함께 보여주면 전환이 필요 없다.
const favoriteCities = computed(() =>
  sortedFilteredWeatherList.value.filter((city) => favorite.isFavorite(city.id)),
)
const otherCities = computed(() =>
  sortedFilteredWeatherList.value.filter((city) => !favorite.isFavorite(city.id)),
)

// 별표를 누르면 카드가 다른 묶음으로 옮겨간다. 무슨 일이 일어났는지 토스트로 알려준다.
const toggleFavorite = (city) => {
  const added = favorite.toggle(city.id)
  ElMessage({
    message: added ? `${city.name} 즐겨찾기에 추가` : `${city.name} 즐겨찾기에서 해제`,
    type: added ? 'success' : 'info',
    duration: 1500,
  })
}

// 과제 6-3) 목록에 없는 도시를 외부 지오코딩으로 찾아 추가한다.
const isAddOpen = ref(false) // '도시 추가' 영역 펼침 여부
// 도시 추가 폼. UI 라이브러리를 쓰는 이유가 "예쁜 카드"가 아니라 이런 입력 검증에 있다.
// 규칙을 선언해두면 언제 검사할지(blur/change), 메시지를 어디에 띄울지, 통과 못 하면
// 제출을 막는 것까지 라이브러리가 처리한다. 직접 만들면 이걸 다 손으로 짜야 한다.
const placeFormRef = ref(null)
const placeForm = reactive({ query: '' })

// 지명에 숫자나 기호가 들어가는 경우는 거의 없다. 그런 입력은 검색해도 쓸모없는 결과만 나온다.
const validatePlaceName = (rule, value, callback) => {
  if (!value) return callback()
  if (!/^[가-힣a-zA-Z\s.'-]+$/.test(value)) {
    return callback(new Error('도시 이름은 한글 또는 영문으로 입력해 주세요.'))
  }
  callback()
}

const placeRules = {
  query: [
    { required: true, message: '추가할 도시 이름을 입력해 주세요.', trigger: 'blur' },
    { min: 2, message: '두 글자 이상 입력해 주세요.', trigger: 'blur' },
    { max: 30, message: '30자를 넘길 수 없습니다.', trigger: 'blur' },
    { validator: validatePlaceName, trigger: 'blur' },
  ],
}
const placeResults = ref([])
const isSearchingPlace = ref(false)
const placeMessage = ref('')

// 검색 결과가 없을 때 그 검색어를 그대로 '도시 추가'로 넘긴다.
const searchOutside = async () => {
  isAddOpen.value = true
  placeForm.query = searchQuery.value.trim()
  // 패널이 화면에 그려진 뒤에야 폼(placeFormRef)이 생긴다.
  // 기다리지 않으면 검증 단계에서 폼을 못 찾아 검색이 조용히 중단된다.
  await nextTick()
  searchExternal()
}

const searchExternal = async () => {
  // 규칙을 통과하지 못하면 여기서 멈춘다. 실패 사유는 폼이 입력창 아래에 직접 표시한다.
  const valid = await placeFormRef.value?.validate().catch(() => false)
  if (!valid) return

  const query = placeForm.query.trim()
  isSearchingPlace.value = true
  placeMessage.value = ''
  placeResults.value = []
  try {
    placeResults.value = await searchPlaces(query)
    if (placeResults.value.length === 0) placeMessage.value = `"${query}" 검색 결과가 없습니다.`
  } catch (error) {
    ElMessage.error('도시 검색에 실패했습니다.')
    console.error('[지오코딩] 실패:', error.message)
  } finally {
    isSearchingPlace.value = false
  }
}

const addPlace = async (place) => {
  try {
    const result = await weather.addCity(place)
    // 결과를 화면 한구석에 문구로 남기는 것보다, 잠깐 떴다 사라지는 토스트가 맞는 자리다.
    // 직접 만들면 위치·애니메이션·자동 닫힘·여러 개 쌓일 때 처리까지 다 신경 써야 한다.
    if (result.added) {
      ElMessage.success(`${result.city.name} 추가됨 (현재 ${result.city.temp}°)`)
      placeResults.value = []
      placeForm.query = ''
    } else {
      ElMessage.warning(result.reason)
    }
  } catch (error) {
    ElMessage.error('날씨를 가져오지 못해 추가하지 못했습니다.')
    console.error('[도시 추가] 실패:', error.message)
  }
}

// 삭제는 되돌릴 수 없으므로 한 번 묻는다. (el-message-box)
const confirmRemove = async (city) => {
  try {
    await ElMessageBox.confirm(`${city.name}을(를) 목록에서 뺄까요?`, '도시 삭제', {
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      type: 'warning',
    })
    weather.removeCity(city.id)
    ElMessage.success(`${city.name} 삭제됨`)
  } catch {
    // 사용자가 취소를 누르면 reject된다. 아무것도 하지 않는다.
  }
}

// SearchBar가 올려보낸 update-query 이벤트를 받아 부모의 검색어 상태를 갱신
const updateQuery = (value) => {
  searchQuery.value = value
}

// WeatherCard가 올려보낸 select-card 이벤트를 받아 선택 도시를 갱신
const selectCity = (city) => {
  dashboard.selectCity(city.id)
}

watch(selectedCityInfo, (newCity) => {
  if (newCity) {
    console.log(
      `📍 [watch] 상태바 갱신 → ${newCity.name}: ${newCity.status}${statusMeta(newCity.status).icon}, ${newCity.temp}°`,
    )
  } else {
    console.log('📍 [watch] 선택된 도시가 없습니다.')
  }
})

watchEffect(() => {
  console.log(`⌨️ [watchEffect] 현재 검색어: "${searchQuery.value}"`)
})

// 기온 기준 정렬 토글 (StatusBar의 toggle-sort 이벤트로 전환)
const sortedFilteredWeatherList = computed(() => {
  const list = [...filteredWeatherList.value]
  if (dashboard.sortOrder === 'asc') return list.sort((a, b) => a.temp - b.temp)
  if (dashboard.sortOrder === 'desc') return list.sort((a, b) => b.temp - a.temp)
  return list
})
watch(
  () => dashboard.sortOrder,
  (newOrder) => {
    console.log(`🔀 [watch] 정렬 기준 변경 → ${newOrder}`)
  },
)

// 과제 4-3) 상세보기: 카드 안에서 펼치는 대신 Programmatic Navigation으로 상세 페이지로 보낸다.
// (자식 WeatherCard는 여전히 click-detail 이벤트만 올려보내고, 이동 결정은 이 화면이 한다)
// 검색 결과가 없을 때 보여줄 문구. 따옴표가 섞여서 템플릿 속성에 직접 쓰기 어려우므로 여기서 만든다.
const emptyText = computed(() => `"${searchQuery.value.trim()}"와(과) 일치하는 도시가 없습니다.`)

const goToDetail = (city) => {
  router.push(`/weather/${city.id}`)
}
</script>

<template>
  <div>
    <!-- 대시보드는 카드 하나로 끝낸다.
         검색·정렬·도시 추가는 전부 "이 목록을 다루는" 도구라, 목록과 같은 상자에 있는 편이 읽기 쉽다.
         (예전에는 검색 카드 / 도시 추가 카드 / 목록 카드 세 개가 똑같이 생겨서 구분이 안 됐다) -->
    <BaseDashboardCard :title="searchQuery.trim() ? '검색 결과' : '지역별 날씨 현황'">
      <template #badge>{{ sortedFilteredWeatherList.length }}곳</template>
      <template #actions>
        <span v-if="freshness" class="freshness">{{ freshness }}</span>
        <el-button
          size="small"
          :loading="weather.isLoading"
          circle
          title="날씨 다시 받기"
          aria-label="날씨 다시 받기"
          @click="refresh"
        >
          <!-- 기호는 장식이고, 의미는 aria-label이 전달한다. -->
          <span aria-hidden="true">↻</span>
        </el-button>
        <button class="sort-btn" @click="dashboard.toggleSortOrder()">
          기온순 정렬 · {{ dashboard.sortLabel }}
        </button>
      </template>

      <!-- 도구 줄: 목록 안에서 찾기(검색) + 목록에 없는 도시 데려오기(추가) -->
      <div class="tools">
        <div class="tools__search">
          <SearchBar :search-query="searchQuery" @update-query="updateQuery" />
        </div>
        <button
          class="tools__toggle"
          :class="{ 'tools__toggle--open': isAddOpen }"
          @click="isAddOpen = !isAddOpen"
        >
          {{ isAddOpen ? '도시 추가 닫기' : '+ 도시 추가' }}
        </button>
      </div>

      <!-- 자주 쓰는 기능이 아니라 평소에는 접어둔다. -->
      <div v-if="isAddOpen" class="place">
        <el-form
          ref="placeFormRef"
          :model="placeForm"
          :rules="placeRules"
          class="place__form"
          @submit.prevent="searchExternal"
        >
          <el-form-item prop="query">
            <el-input
              v-model="placeForm.query"
              placeholder="추가할 도시 이름 (예: 강릉, 속초, Tokyo)"
              clearable
              maxlength="30"
              show-word-limit
              :disabled="!weather.canAddMore"
              @keyup.enter="searchExternal"
            >
              <template #append>
                <el-button
                  type="primary"
                  :loading="isSearchingPlace"
                  :disabled="!weather.canAddMore"
                  @click="searchExternal"
                >
                  좌표 찾기
                </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-form>
        <p class="place__hint">
          OpenStreetMap에서 좌표를 찾은 뒤 날씨를 불러옵니다. 추가한 도시
          {{ weather.extraCount }}/{{ MAX_EXTRA_CITIES }}곳
        </p>
        <p v-if="placeMessage" class="place__msg">{{ placeMessage }}</p>

        <ul v-if="placeResults.length > 0" class="place-list">
          <li v-for="place in placeResults" :key="place.fullName" class="place-list__item">
            <span class="place-list__name">{{ place.name }}</span>
            <span class="place-list__full">{{ place.fullName }}</span>
            <button class="place-list__add" @click="addPlace(place)">목록에 추가</button>
          </li>
        </ul>
      </div>

      <!-- 로딩 중에는 "불러오는 중" 한 줄 대신 카드 모양 자리를 미리 깔아준다.
           화면이 갑자기 늘어나지 않아서 덜 어수선하다. (el-skeleton) -->
      <div v-if="weather.isLoading" class="weather-grid">
        <el-skeleton v-for="n in 11" :key="n" animated>
          <template #template>
            <div class="skeleton-card">
              <el-skeleton-item variant="text" style="width: 40%" />
              <el-skeleton-item variant="h1" style="width: 60%" />
              <el-skeleton-item variant="text" style="width: 50%" />
              <el-skeleton-item variant="button" style="width: 100%" />
            </div>
          </template>
        </el-skeleton>
      </div>

      <el-alert
        v-else-if="weather.error"
        :title="weather.error"
        type="error"
        :closable="false"
        show-icon
      >
        <template #default>
          <el-button size="small" type="primary" @click="weather.loadAll({ force: true })">
            다시 시도
          </el-button>
        </template>
      </el-alert>

      <!-- 선택 피드백은 카드의 '선택됨' 칩이 맡는다.
           여기서 한 번 더 번쩍이게 했더니 가로로 긴 영역이 파랗게 깜빡여서 오류처럼 보였다. -->
      <div
        v-if="!weather.isLoading"
        class="selection"
        :class="{ 'selection--empty': !selectedCityInfo }"
      >
        <template v-if="selectedCityInfo">
          <span class="selection__name">{{ selectedCityInfo.name }}</span>
          <span class="selection__temp sk-num">
            {{ config.displayTemp(selectedCityInfo.temp) }}{{ config.unitSymbol }}
          </span>
          <span class="selection__status">
            {{ selectedCityInfo.status }}{{ statusMeta(selectedCityInfo.status).icon }}
          </span>
          <RouterLink :to="`/weather/${selectedCityInfo.id}`" class="selection__link">
            상세 관측 정보 →
          </RouterLink>
        </template>
        <span v-else>도시 카드를 클릭하면 여기에 선택한 도시가 표시됩니다.</span>
      </div>

      <template v-if="!weather.isLoading && sortedFilteredWeatherList.length > 0">
        <!-- 즐겨찾기한 도시는 위쪽에 따로 모은다. 하나도 없으면 이 묶음 자체가 나타나지 않는다. -->
        <template v-if="favoriteCities.length > 0">
          <p class="group-title">
            <span class="group-title__star" aria-hidden="true">★</span>
            즐겨찾기 {{ favoriteCities.length }}곳
          </p>
          <TransitionGroup name="card" tag="div" class="weather-grid">
            <WeatherCard
              v-for="city in favoriteCities"
              :key="city.id"
              :city="city"
              :selected="selectedCityInfo?.id === city.id"
              :query="searchQuery.trim()"
              :display-temp="config.displayTemp(city.temp)"
              :unit-symbol="config.unitSymbol"
              detail-label="상세보기 →"
              :removable="city.isExtra === true"
              favoritable
              :favorite="favorite.isFavorite(city.id)"
              @select-card="selectCity"
              @click-detail="goToDetail"
              @toggle-favorite="toggleFavorite"
              @remove-card="confirmRemove"
            />
          </TransitionGroup>

          <p class="group-title group-title--sub">그 밖의 도시 {{ otherCities.length }}곳</p>
        </template>

        <TransitionGroup name="card" tag="div" class="weather-grid">
          <WeatherCard
            v-for="city in otherCities"
            :key="city.id"
            :city="city"
            :selected="selectedCityInfo?.id === city.id"
            :query="searchQuery.trim()"
            :display-temp="config.displayTemp(city.temp)"
            :unit-symbol="config.unitSymbol"
            detail-label="상세보기 →"
            :removable="city.isExtra === true"
            favoritable
            :favorite="favorite.isFavorite(city.id)"
            @select-card="selectCity"
            @click-detail="goToDetail"
            @toggle-favorite="toggleFavorite"
            @remove-card="confirmRemove"
          />
        </TransitionGroup>
      </template>
      <!-- 목록에 없는 도시를 찾았다는 뜻이므로, 여기서 바로 추가로 넘어갈 수 있게 한다.
           안내만 띄우고 끝내면 사용자가 위로 올라가 '도시 추가'를 다시 눌러야 한다. -->
      <el-empty v-else-if="!weather.isLoading && !weather.error" :description="emptyText">
        <el-button type="primary" @click="searchOutside">
          "{{ searchQuery.trim() }}" 외부에서 찾아 추가하기
        </el-button>
      </el-empty>
    </BaseDashboardCard>
  </div>
</template>

<style scoped>
.freshness {
  font-size: var(--sk-text-xs);
  color: var(--sk-text-muted);
}
/* 묶음 제목. 카드 그리드끼리 붙어 있으면 어디까지가 즐겨찾기인지 알 수 없다.
   별표 색(--sk-w-sunny)을 그대로 쓰니 흰 배경에서 대비가 1.94로 거의 안 보였다.
   별 아이콘만 노란색으로 두고 글자는 본문 색을 쓴다. */
.group-title {
  margin: 0 0 var(--sk-space-3);
  font-size: var(--sk-text-sm);
  font-weight: 700;
  color: var(--sk-text);
}
.group-title__star {
  color: var(--sk-w-sunny);
}
.group-title--sub {
  margin-top: var(--sk-space-6);
  color: var(--sk-text-muted);
}
.fav-count {
  font-size: var(--sk-text-xs);
  color: var(--sk-text-muted);
  font-weight: 600;
}
.place__form {
  width: 100%;
}
/* el-form의 오류 메시지는 form-item 아래에 절대 위치로 붙는다.
   margin-bottom을 0으로 두면 그 자리에 다음 문단이 겹쳐 보이므로, 메시지 높이만큼 자리를 비워둔다. */
.place__form :deep(.el-form-item) {
  margin-bottom: var(--sk-space-6);
}
.skeleton-card {
  display: flex;
  flex-direction: column;
  gap: var(--sk-space-3);
  align-items: center;
  padding: var(--sk-space-4);
  border: 1px solid var(--sk-border);
  border-radius: var(--sk-radius);
  background-color: var(--sk-surface);
}
.tools {
  display: flex;
  gap: var(--sk-space-3);
  align-items: flex-start;
  flex-wrap: wrap;
  margin-bottom: var(--sk-space-4);
}
.tools__search {
  flex: 1;
  min-width: 240px;
}
.tools__toggle {
  border: 1px solid var(--sk-accent);
  background-color: var(--sk-accent);
  border-radius: var(--sk-radius);
  padding: 12px var(--sk-space-5);
  font-size: var(--sk-text-sm);
  font-weight: 700;
  color: var(--sk-text-invert);
  white-space: nowrap;
  cursor: pointer;
}
.tools__toggle:hover {
  background-color: var(--sk-accent-hover);
  border-color: var(--sk-accent-hover);
}
/* 펼친 상태에서는 '닫기'가 주 동작이 아니므로 무게를 낮춘다.
   :hover 규칙이 이 규칙보다 우선순위가 높아서, 펼친 상태의 hover도 따로 지정해야
   파란 배경에 파란 글씨가 되는 일을 막을 수 있다. */
.tools__toggle--open {
  background-color: var(--sk-surface);
  color: var(--sk-accent);
}
.tools__toggle--open:hover {
  background-color: var(--sk-accent-weak);
  border-color: var(--sk-accent);
  color: var(--sk-accent);
}
.place__hint {
  width: 100%;
  margin: 0;
  font-size: var(--sk-text-xs);
  color: var(--sk-text-muted);
}
.place {
  display: flex;
  align-items: center;
  gap: var(--sk-space-2);
  flex-wrap: wrap;
  margin-bottom: var(--sk-space-4);
  padding: var(--sk-space-4);
  border: 1px solid var(--sk-border);
  border-radius: var(--sk-radius);
  background-color: var(--sk-surface-alt);
}
.place__input {
  flex: 1;
  min-width: 240px;
  padding: 12px 16px;
  border: 1px solid var(--sk-border-strong);
  border-radius: var(--sk-radius);
  font-size: var(--sk-text-md);
  box-sizing: border-box;
}
.place__input:focus {
  outline: none;
  border-color: var(--sk-accent);
  box-shadow: 0 0 0 3px var(--sk-accent-ring);
}
.place__btn {
  border: 1px solid var(--sk-accent);
  background-color: var(--sk-accent-weak);
  border-radius: var(--sk-radius);
  padding: var(--sk-space-2) var(--sk-space-4);
  font-size: var(--sk-text-sm);
  font-weight: 600;
  color: var(--sk-accent);
  cursor: pointer;
}
.place__btn:disabled {
  color: var(--sk-text-muted);
  cursor: not-allowed;
}
.place__msg {
  margin: var(--sk-space-3) 0 0;
  font-size: var(--sk-text-sm);
  color: var(--sk-text-muted);
}
.added {
  display: flex;
  align-items: center;
  gap: var(--sk-space-2);
  flex-wrap: wrap;
  margin-top: var(--sk-space-4);
  padding-top: var(--sk-space-4);
  border-top: 1px solid var(--sk-border);
}
.added__label {
  font-size: var(--sk-text-xs);
  font-weight: 700;
  color: var(--sk-text-muted);
}
.added__chip {
  display: inline-flex;
  align-items: center;
  gap: var(--sk-space-2);
  background-color: var(--sk-accent-weak);
  color: var(--sk-accent);
  border-radius: var(--sk-radius-pill);
  padding: 4px 6px 4px 12px;
  font-size: var(--sk-text-sm);
  font-weight: 700;
}
.added__del {
  border: none;
  background: none;
  color: inherit;
  cursor: pointer;
  font-size: var(--sk-text-xs);
  padding: 0 4px;
}
.place-list {
  list-style: none;
  margin: var(--sk-space-3) 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sk-space-2);
}
.place-list__item {
  display: flex;
  align-items: center;
  gap: var(--sk-space-3);
  padding: var(--sk-space-2) var(--sk-space-3);
  border: 1px solid var(--sk-border);
  border-radius: var(--sk-radius);
  font-size: var(--sk-text-sm);
}
.place-list__name {
  font-weight: 700;
  flex-shrink: 0;
}
.place-list__full {
  flex: 1;
  color: var(--sk-text-muted);
  font-size: var(--sk-text-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.place-list__add {
  flex-shrink: 0;
  border: none;
  background-color: var(--sk-accent);
  color: var(--sk-text-invert);
  border-radius: var(--sk-radius-sm);
  padding: 4px 12px;
  font-size: var(--sk-text-xs);
  font-weight: 700;
  cursor: pointer;
}
.state {
  margin: 0 0 var(--sk-space-4);
  padding: var(--sk-space-3) var(--sk-space-4);
  border-radius: var(--sk-radius);
  background-color: var(--sk-surface-alt);
  color: var(--sk-text-muted);
  font-size: var(--sk-text-sm);
}
.state--error {
  background-color: var(--sk-danger-weak);
  color: var(--sk-danger);
}
.retry {
  margin-left: var(--sk-space-3);
  border: 1px solid currentColor;
  background: none;
  color: inherit;
  border-radius: var(--sk-radius-sm);
  padding: 2px 10px;
  font-size: var(--sk-text-xs);
  font-weight: 700;
  cursor: pointer;
}
.sort-btn {
  border: 1px solid var(--sk-border);
  background-color: var(--sk-surface);
  border-radius: var(--sk-radius-pill);
  padding: var(--sk-space-2) var(--sk-space-4);
  font-size: var(--sk-text-sm);
  font-weight: 600;
  color: var(--sk-text);
  cursor: pointer;
  white-space: nowrap;
}
.sort-btn:hover {
  background-color: var(--sk-surface-hover);
}

/* 선택된 도시 요약: 카드를 하나 더 만들지 않고 목록 머리에 한 줄로 붙인다. */
.selection {
  display: flex;
  align-items: baseline;
  gap: var(--sk-space-4);
  flex-wrap: wrap;
  margin-bottom: var(--sk-space-5);
  padding: var(--sk-space-4) var(--sk-space-5);
  border-radius: var(--sk-radius-lg);
  background-color: var(--sk-accent-weak);
  font-size: var(--sk-text-md);
}
/* 아직 아무것도 안 고른 상태.
   전에는 배경색이 카드와 같아서 상자가 안 보이고 글자만 떠 있었다.
   점선 테두리로 "여기에 뭔가 들어올 자리"라는 게 드러나게 하고, 높이도 줄인다. */
.selection--empty {
  justify-content: center;
  background-color: transparent;
  border: 1px dashed var(--sk-border-strong);
  color: var(--sk-text-muted);
  font-size: var(--sk-text-sm);
  padding: var(--sk-space-3) var(--sk-space-4);
}
.selection__name {
  font-size: var(--sk-text-xl);
  font-weight: 800;
  letter-spacing: -0.01em;
}
.selection__temp {
  font-size: var(--sk-text-2xl);
  font-weight: 800;
  letter-spacing: -0.02em;
}
.selection__status {
  color: var(--sk-accent);
  font-size: var(--sk-text-md);
  font-weight: 600;
}
.selection__link {
  margin-left: auto;
  font-size: var(--sk-text-md);
  font-weight: 700;
  color: var(--sk-accent);
  text-decoration: none;
}
.selection__link:hover {
  text-decoration: underline;
}
/* 과제 3-5) 부모가 직접 그리는 영역(배너/제목/그리드/빈 결과)만 여기에서 관리 */

.weather-grid {
  /* flex + wrap은 마지막 줄 카드 폭이 들쭉날쭉해진다.
     grid auto-fill로 두면 화면 폭이 변해도 열 너비가 균일하게 유지된다. */
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--sk-space-3);
  align-items: start;
}

/* TransitionGroup 클래스는 자식(WeatherCard)의 루트 엘리먼트에 붙는데,
   자식 루트에는 부모의 scoped 속성도 함께 붙으므로 여기에서 스타일 지정이 가능하다. */
.card-move,
.card-enter-active,
.card-leave-active {
  transition: all 0.35s ease;
}
.card-enter-from,
.card-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.empty-message {
  margin: 0;
  color: var(--sk-danger);
  background-color: var(--sk-danger-weak);
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 14px;
}
/* 좁은 화면에서는 카드 최소 폭을 줄여 2열을 유지한다.
   150px로 두면 375px 화면에서 1열이 되어 카드 11장이 세로로 길게 늘어선다. */
@media (max-width: 640px) {
  .weather-grid {
    grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
  }
}
</style>
