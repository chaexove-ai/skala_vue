<script setup>
// 과제 4-3) WeatherHomeView: 과제 3의 WeatherParent를 라우터 구조에 맞게 옮긴 메인 대시보드 화면.
// 달라진 점은 두 가지뿐이다.
//   1. 도시 데이터를 파일 안에 두지 않고 공통 Mock Data(src/data/weatherData.js)에서 가져온다.
//      → 상세 페이지가 같은 데이터를 봐야 하기 때문.
//   2. 상세보기를 카드 안에서 펼치지 않고 router.push로 상세 페이지(/weather/:cityId)로 이동한다.
// 반응형 상태를 이 화면이 모두 소유하고, 자식은 props/emits로만 통신하는 구조는 그대로다.
import { ref, computed, watch, watchEffect, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { CITY_WEATHER } from '@/data/weatherData.js'
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

const weatherList = ref(CITY_WEATHER)

const searchQuery = ref('')
// 선택한 도시는 스토어가 id만 갖고, 화면은 그 id로 도시 객체를 찾아 쓴다.
// (스토어에 객체를 통째로 넣어두면 원본 데이터가 바뀌었을 때 옛 정보가 남는다)
const selectedCityInfo = computed(
  () => weatherList.value.find((city) => city.id === dashboard.selectedCityId) ?? null,
)

const filteredWeatherList = computed(() =>
  weatherList.value.filter((city) => city.name.includes(searchQuery.value.trim())),
)

onMounted(() => {
  console.log(`🏁 [onMounted] 메인 대시보드 준비 완료 — 카드 ${weatherList.value.length}장`)
})

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
    <!-- 카드 1) 도시 검색 + 정렬: 과제 3에서는 검색과 상태바를 카드 두 개로 나눴지만,
         앱 셸(헤더·히어로)이 생긴 뒤로는 구획이 한 겹 더 있는 셈이라 하나로 합쳤다.
         상태를 이 화면이 소유하고 자식과는 props / emits로만 통신하는 구조는 그대로다. -->
    <BaseDashboardCard title="도시 검색">
      <template #badge>{{
        searchQuery.trim() ? `"${searchQuery.trim()}" 검색 중` : '전체 보기'
      }}</template>

      <div class="toolbar">
        <div class="toolbar__search">
          <SearchBar :search-query="searchQuery" @update-query="updateQuery" />
        </div>
        <button class="sort-btn" @click="dashboard.toggleSortOrder()">
          기온순 정렬 · {{ dashboard.sortLabel }}
        </button>
      </div>
    </BaseDashboardCard>

    <!-- 카드 2) 목록. 선택된 도시 요약은 별도 카드를 만들지 않고 목록 머리에 붙인다. -->
    <BaseDashboardCard :title="searchQuery.trim() ? '검색 결과' : '지역별 날씨 현황'">
      <template #badge>{{ sortedFilteredWeatherList.length }}곳</template>

      <div class="selection" :class="{ 'selection--empty': !selectedCityInfo }">
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

      <!-- TransitionGroup: 정렬을 바꾸거나 검색으로 카드가 걸러질 때 위치 이동을 애니메이션으로 보여준다. -->
      <TransitionGroup
        v-if="sortedFilteredWeatherList.length > 0"
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
          @select-card="selectCity"
          @click-detail="goToDetail"
        />
      </TransitionGroup>
      <p v-else class="empty-message">"{{ searchQuery }}"와(과) 일치하는 도시가 없습니다.</p>
    </BaseDashboardCard>
  </div>
</template>

<style scoped>
/* 검색창과 정렬 버튼을 한 줄에 둔다. 좁은 화면에서는 자연스럽게 두 줄로 접힌다. */
.toolbar {
  display: flex;
  gap: var(--sk-space-3);
  align-items: flex-start;
  flex-wrap: wrap;
}
.toolbar__search {
  flex: 1;
  min-width: 240px;
}
.sort-btn {
  border: 1px solid var(--sk-border);
  background-color: var(--sk-surface);
  border-radius: var(--sk-radius);
  padding: 12px var(--sk-space-4);
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
