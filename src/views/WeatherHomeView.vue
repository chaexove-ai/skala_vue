<script setup>
// 과제 4-3) WeatherHomeView: 과제 3의 WeatherParent를 라우터 구조에 맞게 옮긴 메인 대시보드 화면.
// 달라진 점은 두 가지뿐이다.
//   1. 도시 데이터를 파일 안에 두지 않고 공통 Mock Data(src/data/weatherData.js)에서 가져온다.
//      → 상세 페이지가 같은 데이터를 봐야 하기 때문.
//   2. 상세보기를 카드 안에서 펼치지 않고 router.push로 상세 페이지(/weather/:cityId)로 이동한다.
// 반응형 상태를 이 화면이 모두 소유하고, 자식은 props/emits로만 통신하는 구조는 그대로다.
import { ref, computed, watch, watchEffect, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWeatherStore } from '@/stores/weatherStore.js'
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

// 화면이 열릴 때 실제 날씨를 불러온다. 이미 받아둔 게 있으면 스토어가 알아서 건너뛴다.
onMounted(() => weather.loadAll())

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

// 과제 6-3) 목록에 없는 도시를 외부 지오코딩으로 찾아 추가한다.
const isAddOpen = ref(false) // '도시 추가' 영역 펼침 여부
const placeQuery = ref('') // 도시 추가 전용 입력창 (위쪽 검색창과 별개)
const placeResults = ref([])
const isSearchingPlace = ref(false)
const placeMessage = ref('')

const searchExternal = async () => {
  const query = placeQuery.value.trim()
  if (!query) return
  isSearchingPlace.value = true
  placeMessage.value = ''
  placeResults.value = []
  try {
    placeResults.value = await searchPlaces(query)
    if (placeResults.value.length === 0) placeMessage.value = `"${query}" 검색 결과가 없습니다.`
  } catch (error) {
    placeMessage.value = '도시 검색에 실패했습니다.'
    console.error('[지오코딩] 실패:', error.message)
  } finally {
    isSearchingPlace.value = false
  }
}

const addPlace = async (place) => {
  try {
    const result = await weather.addCity(place)
    placeMessage.value = result.added
      ? `${result.city.name} 추가됨 (현재 ${result.city.temp}°)`
      : result.reason
    placeResults.value = []
    placeQuery.value = ''
  } catch (error) {
    placeMessage.value = '날씨를 가져오지 못해 추가하지 못했습니다.'
    console.error('[도시 추가] 실패:', error.message)
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
        <input
          v-model="placeQuery"
          class="place__input"
          placeholder="추가할 도시 이름 (예: 강릉, 속초, Tokyo)"
          @keyup.enter="searchExternal"
        />
        <button
          class="place__btn"
          :disabled="!placeQuery.trim() || isSearchingPlace"
          @click="searchExternal"
        >
          {{ isSearchingPlace ? '찾는 중...' : '좌표 찾기' }}
        </button>
        <p class="place__hint">OpenStreetMap에서 좌표를 찾은 뒤 날씨를 불러옵니다.</p>
        <p v-if="placeMessage" class="place__msg">{{ placeMessage }}</p>

        <ul v-if="placeResults.length > 0" class="place-list">
          <li v-for="place in placeResults" :key="place.fullName" class="place-list__item">
            <span class="place-list__name">{{ place.name }}</span>
            <span class="place-list__full">{{ place.fullName }}</span>
            <button class="place-list__add" @click="addPlace(place)">목록에 추가</button>
          </li>
        </ul>
      </div>

      <p v-if="weather.isLoading" class="state">실시간 날씨를 불러오는 중입니다...</p>
      <p v-else-if="weather.error" class="state state--error">
        {{ weather.error }}
        <button class="retry" @click="weather.loadAll({ force: true })">다시 시도</button>
      </p>

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

      <TransitionGroup
        v-if="!weather.isLoading && sortedFilteredWeatherList.length > 0"
        name="card"
        tag="div"
        class="weather-grid"
      >
        <WeatherCard
          v-for="city in sortedFilteredWeatherList"
          :key="city.id"
          :city="city"
          :selected="selectedCityInfo?.id === city.id"
          :query="searchQuery.trim()"
          :display-temp="config.displayTemp(city.temp)"
          :unit-symbol="config.unitSymbol"
          detail-label="상세보기 →"
          :removable="city.isExtra === true"
          @select-card="selectCity"
          @click-detail="goToDetail"
          @remove-card="weather.removeCity(city.id)"
        />
      </TransitionGroup>
      <p v-else-if="!weather.isLoading && !weather.error" class="empty-message">
        "{{ searchQuery }}"와(과) 일치하는 도시가 없습니다.
      </p>
    </BaseDashboardCard>
  </div>
</template>

<style scoped>
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
.selection--empty {
  background-color: var(--sk-surface-alt);
  color: var(--sk-text-muted);
  font-size: var(--sk-text-base);
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
  color: var(--sk-text-muted);
  font-size: var(--sk-text-md);
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
</style>
