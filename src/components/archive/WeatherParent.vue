<script setup>
// 과제 3-1) WeatherParent: 모든 반응형 데이터(상태)와 로직은 부모가 그대로 보유한다.
// 과제 2(WeatherComposition)의 기능은 변경하지 않고, 화면만 4개 컴포넌트로 분리했다.
import { ref, computed, watch, watchEffect, onMounted } from 'vue'
import { statusMeta, isWet } from '@/data/weatherStatus.js'
import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'
import SearchBar from '@/components/exercise/SearchBar.vue'
import StatusBar from '@/components/exercise/StatusBar.vue'
import WeatherCard from '@/components/exercise/WeatherCard.vue'

const weatherList = ref([
  { id: 'city_01', name: '서울', temp: 28, status: '맑음' },
  { id: 'city_02', name: '수원', temp: 24, status: '비' },
  { id: 'city_03', name: '부산', temp: 26, status: '구름' },
  { id: 'city_04', name: '전주', temp: 22, status: '흐림' },
  { id: 'city_05', name: '제주', temp: 22, status: '맑음' },
  { id: 'city_06', name: '대구', temp: 31, status: '맑음' },
  { id: 'city_07', name: '인천', temp: 25, status: '흐림' },
  { id: 'city_08', name: '광주', temp: 27, status: '맑음' },
  { id: 'city_09', name: '대전', temp: 24, status: '비' },
  { id: 'city_10', name: '울산', temp: 26, status: '구름' },
  { id: 'city_11', name: '세종', temp: 23, status: '흐림' },
])

const searchQuery = ref('')
const selectedCityInfo = ref(null)

const filteredWeatherList = computed(() =>
  weatherList.value.filter((city) => city.name.includes(searchQuery.value.trim())),
)

// 라이프사이클 순서 확인용: 자식(WeatherCard) 11장이 모두 마운트된 뒤에 부모가 마운트된다.
// 콘솔 로그 순서가 그대로 부모-자식 마운트 순서를 보여준다.
onMounted(() => {
  console.log(`🏁 [onMounted] 부모(WeatherParent) 준비 완료 — 카드 ${weatherList.value.length}장`)
})

// SearchBar가 올려보낸 update-query 이벤트를 받아 부모의 검색어 상태를 갱신
const updateQuery = (value) => {
  searchQuery.value = value
}

// WeatherCard가 올려보낸 select-card 이벤트를 받아 선택 도시를 갱신
const selectCity = (city) => {
  selectedCityInfo.value = city
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
const sortOrder = ref('none')
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'none' ? 'asc' : sortOrder.value === 'asc' ? 'desc' : 'none'
}
const sortedFilteredWeatherList = computed(() => {
  const list = [...filteredWeatherList.value]
  if (sortOrder.value === 'asc') return list.sort((a, b) => a.temp - b.temp)
  if (sortOrder.value === 'desc') return list.sort((a, b) => b.temp - a.temp)
  return list
})
watch(sortOrder, (newOrder) => {
  console.log(`🔀 [watch] 정렬 기준 변경 → ${newOrder}`)
})

// 상세보기: WeatherCard의 click-detail 이벤트로 열고 닫는다.
const expandedCityId = ref(null)
const toggleDetail = (city) => {
  expandedCityId.value = expandedCityId.value === city.id ? null : city.id
}
const expandedCity = computed(
  () => weatherList.value.find((c) => c.id === expandedCityId.value) ?? null,
)
const feelsLikeTemp = computed(() => {
  if (!expandedCity.value) return null
  const { temp, status } = expandedCity.value
  return temp + statusMeta(status).feelsAdjust
})
watch(expandedCityId, (id) => {
  const city = weatherList.value.find((c) => c.id === id)
  console.log(city ? `🔍 [watch] 상세보기 열림 → ${city.name}` : '🔍 [watch] 상세보기 닫힘')
})

// 본인 Mockup(과제 1)에서 만들었던 "생활 팁"을 그대로 가져와, WeatherCard의 범위 슬롯에 끼워 넣는다.
const getWeatherTip = (status, temp) => {
  if (isWet(status)) return '☂️ 우산을 챙기세요'
  if (status === '맑음' && temp >= 25) return '🧴 자외선 차단제를 바르세요'
  if (status === '흐림' || status === '구름') return '🧥 얇은 겉옷을 챙기면 좋아요'
  return '🌤️ 나들이하기 좋은 날씨예요'
}

watch(filteredWeatherList, (list) => {
  if (expandedCityId.value && !list.some((c) => c.id === expandedCityId.value)) {
    expandedCityId.value = null
  }
})
</script>

<template>
  <div class="practice-section">
    <p class="exercise-meta">판교 · 5반 · 임채환 · 보관함 경로 <code>/archive/component</code></p>

    <!-- 보관함 페이지의 제목(히어로)이 h1이므로 여기서는 h2를 쓴다. 모양은 그대로다. -->
    <h2 class="page-title"><span class="page-title__badge">과제 3</span>✂️Weather Component</h2>

    <!-- 과제 3-6) Slot으로 넘기는 자식(SearchBar / StatusBar / WeatherCard)은 화면상으로는
         BaseDashboardCard 안에 있지만, 스크립트는 부모(WeatherParent) 스코프에서 컴파일된다.
         그래서 여기서 searchQuery / selectedCityInfo 같은 부모의 상태와 직접 바인딩할 수 있다. -->
    <BaseDashboardCard title="🔍 도시 검색 (한글 즉시 동기화)">
      <template #badge>{{
        searchQuery.trim() ? `"${searchQuery.trim()}" 검색 중` : '전체 보기'
      }}</template>
      <SearchBar :search-query="searchQuery" @update-query="updateQuery" />
    </BaseDashboardCard>

    <BaseDashboardCard>
      <StatusBar
        :selected-city-info="selectedCityInfo"
        :sort-order="sortOrder"
        @toggle-sort="toggleSortOrder"
      />
    </BaseDashboardCard>

    <BaseDashboardCard :title="searchQuery.trim() ? '검색 결과' : '지역별 날씨 현황'">
      <template #badge>{{ sortedFilteredWeatherList.length }}곳</template>

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
          :expanded="expandedCityId === city.id"
          :feels-like="expandedCityId === city.id ? feelsLikeTemp : null"
          @select-card="selectCity"
          @click-detail="toggleDetail"
        >
          <!-- 범위 슬롯: 카드가 올려보낸 slotProps(city, feelsLike)를 부모가 받아서 상세 내용을 구성 -->
          <template #detail="{ city: detailCity, feelsLike }">
            <p class="detail-line">
              체감 온도 <strong>{{ feelsLike }}°</strong>
            </p>
            <p class="detail-line">{{ getWeatherTip(detailCity.status, detailCity.temp) }}</p>
          </template>
        </WeatherCard>
      </TransitionGroup>
      <p v-else class="empty-message">"{{ searchQuery }}"와(과) 일치하는 도시가 없습니다.</p>
    </BaseDashboardCard>
  </div>
</template>

<style scoped>
.exercise-meta {
  margin: 0 0 var(--sk-space-3);
  font-size: var(--sk-text-xs);
  color: var(--sk-text-muted);
}
.exercise-meta code {
  background-color: var(--sk-surface-hover);
  border-radius: var(--sk-radius-sm);
  padding: 2px 6px;
}
/* 과제 3-5) 부모가 직접 그리는 영역(배너/제목/그리드/빈 결과)만 여기에서 관리 */

.page-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 24px;
  font-weight: 500;
  margin-bottom: 16px;
}
.page-title__badge {
  font-weight: 800;
  font-size: 15px;
  color: var(--sk-accent);
  background-color: var(--sk-accent-weak);
  padding: 4px 12px;
  border-radius: 999px;
}

.weather-grid {
  display: flex;
  gap: var(--sk-space-3);
  flex-wrap: wrap;
  /* 기본값 stretch면 한 카드의 상세보기가 열릴 때 같은 줄의 카드가 전부 같이 늘어난다.
     flex-start로 두면 펼쳐진 카드만 길어지고 나머지는 제자리에 있는다. */
  align-items: flex-start;
}

.detail-line {
  margin: 0 0 4px;
}
.detail-line:last-child {
  margin-bottom: 0;
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
