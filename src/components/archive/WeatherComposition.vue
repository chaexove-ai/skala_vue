<script setup>
import { ref, computed, watch, watchEffect } from 'vue'
import { statusMeta, statusIcon } from '@/data/weatherStatus.js'

// 1) 반응형 상태 관리
// weatherList: Weather Mockup 실습(1일차 계열)에서 썼던 것과 동일한 한국 주요 도시 데이터를 재사용
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

// 검색어
const searchQuery = ref('')
// 선택된 도시의 전체 정보 객체 (이름뿐 아니라 온도/상태까지 함께 보관)
const selectedCityInfo = ref(null)

// 2) computed: 검색어가 도시 이름에 포함된 항목만 필터링해서 담아두는 배열
const filteredWeatherList = computed(() =>
  weatherList.value.filter((city) => city.name.includes(searchQuery.value.trim())),
)

// 도시 카드를 클릭하면 selectedCityInfo를 갱신
const selectCity = (city) => {
  selectedCityInfo.value = city
}

// 날씨 상태에 따라 카드 색상을 다르게 주기 위한 클래스: 공통 테이블(weatherStatus.js)의 theme을 사용
const getStatusClass = (status) => `weather-card--${statusMeta(status).theme}`

// 3-1) watch: selectedCityInfo를 감시해서, 상태바 문구가 바뀔 때마다 콘솔로그를 남김
watch(selectedCityInfo, (newCity) => {
  if (newCity) {
    console.log(`📍 [watch] 상태바 갱신 → ${newCity.name}: ${newCity.status}${statusIcon(newCity.status)}, ${newCity.temp}°`)
  } else {
    console.log('📍 [watch] 선택된 도시가 없습니다.')
  }
})

// 3-2) watchEffect: 감시 대상을 따로 지정하지 않아도, 콜백 내부에서 쓴 searchQuery를
// Vue가 자동으로 추적해서 타이핑할 때마다 바로 반응함
watchEffect(() => {
  console.log(`⌨️ [watchEffect] 현재 검색어: "${searchQuery.value}"`)
})

// 5) 나만의 추가 기능: 기온 기준 정렬 토글
// - 반응형 상태 변수: sortOrder ('none' | 'asc' | 'desc')
// - Computed: sortedFilteredWeatherList (filteredWeatherList를 sortOrder 기준으로 정렬)
// - Watcher: sortOrder가 바뀔 때마다 콘솔로그
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

// 6) 상세보기: 카드마다 버튼을 두고, 눌린 도시의 "체감 온도"를 computed로 계산해서 보여줌
// (실제 API 값이 아니라 온도 + 날씨 상태를 조합한 간단한 계산 예시)
const expandedCityId = ref(null)
const toggleDetail = (city) => {
  expandedCityId.value = expandedCityId.value === city.id ? null : city.id
}
const expandedCity = computed(() => weatherList.value.find((c) => c.id === expandedCityId.value) ?? null)
const feelsLikeTemp = computed(() => {
  if (!expandedCity.value) return null
  const { temp, status } = expandedCity.value
  return temp + statusMeta(status).feelsAdjust
})
watch(expandedCityId, (id) => {
  const city = weatherList.value.find((c) => c.id === id)
  console.log(city ? `🔍 [watch] 상세보기 열림 → ${city.name}` : '🔍 [watch] 상세보기 닫힘')
})

// 검색어가 바뀌어서 상세보기가 열려있던 도시가 화면에서 사라지면, 상세보기 상태도 같이 닫아줌
// (안 그러면 검색어를 지웠을 때 누르지도 않은 카드의 상세보기가 열린 채로 다시 나타남)
watch(filteredWeatherList, (list) => {
  if (expandedCityId.value && !list.some((c) => c.id === expandedCityId.value)) {
    expandedCityId.value = null
  }
})
</script>

<template>
  <div class="practice-section">
    <p class="exercise-meta">
      판교 · 5반 · 임채환 · 보관함 경로 <code>/archive/composition</code>
    </p>

    <h1 class="page-title"><span class="page-title__badge">과제 2</span>🧩 Weather Composition</h1>

    <section class="search-box card-block">
      <h3>도시 이름 검색</h3>
      <input v-model="searchQuery" type="text" class="search-input" placeholder="도시 이름을 입력해보세요" />
    </section>

    <section class="status-box card-block">
      <p class="status-bar">
        <span v-if="selectedCityInfo">
          <strong>{{ selectedCityInfo.name }}</strong>의 현재 날씨는 {{ selectedCityInfo.status }}{{ statusIcon(selectedCityInfo.status) }},
          {{ selectedCityInfo.temp }}°입니다.
        </span>
        <span v-else class="status-bar__placeholder">📍 도시 카드를 클릭하면 여기에 선택된 도시의 상세 정보가 표시됩니다.</span>
      </p>
      <button class="sort-btn" @click="toggleSortOrder">
        🌡️ 기온순 정렬: {{ sortOrder === 'asc' ? '오름차순 ▲' : sortOrder === 'desc' ? '내림차순 ▼' : '기본 순서' }}
      </button>
    </section>

    <section class="weather-section card-block">
      <h3>{{ searchQuery.trim() ? '검색 결과' : '지역별 날씨 현황' }}</h3>

      <!-- 4) 검색 결과 표시 -->
      <!-- 검색어가 비었을 때(원본 전체)와 일치하는 데이터가 있을 때(필터링 결과) 모두 -->
      <!-- 카드 마크업은 동일하므로 하나의 분기로 합치고, "매치 강조"만 검색어 유무로 켜고 끔 -->
      <template v-if="sortedFilteredWeatherList.length > 0">
        <div class="weather-grid">
          <div
            v-for="city in sortedFilteredWeatherList"
            :key="city.id"
            class="weather-card"
            :class="[
              getStatusClass(city.status),
              {
                'weather-card--selected': selectedCityInfo?.id === city.id,
                'weather-card--matched': searchQuery.trim() !== '',
              },
            ]"
            @click="selectCity(city)"
          >
            <p class="weather-card__name">{{ city.name }}</p>
            <p class="weather-card__temp">{{ city.temp }}°</p>
            <p class="weather-card__status">{{ city.status }}{{ statusIcon(city.status) }}</p>

            <button class="detail-btn" @click.stop="toggleDetail(city)">
              {{ expandedCityId === city.id ? '상세보기 닫기 ▲' : '상세보기 ▼' }}
            </button>
            <div v-if="expandedCityId === city.id" class="weather-card__detail">
              체감 온도 <strong>{{ feelsLikeTemp }}°</strong>
            </div>
          </div>
        </div>
      </template>

      <!-- 검색어와 일치하는 데이터가 없을 때: 안내 문구 -->
      <template v-else>
        <p class="empty-message">"{{ searchQuery }}"와(과) 일치하는 도시가 없습니다.</p>
      </template>
    </section>
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

.card-block {
  border: 1px solid var(--sk-border);
  border-radius: 12px;
  padding: 16px 18px;
  margin-bottom: 16px;
  background-color: var(--sk-surface-alt);
}
.card-block > h3 {
  margin: 0 0 14px;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--sk-border-strong);
  border-radius: 8px;
  font-size: 16px;
}
.search-input:focus {
  outline: none;
  border-color: var(--sk-accent);
  box-shadow: 0 0 0 3px var(--sk-accent-ring);
}

.status-bar {
  margin: 0 0 14px;
  font-size: 20px;
  font-weight: 400;
  color: var(--sk-text);
  line-height: 1.5;
}
.status-bar strong {
  font-weight: 700;
}
.status-bar__placeholder {
  font-size: 14px;
  font-weight: 400;
  color: var(--sk-text-muted);
}
.sort-btn {
  border: 1px solid var(--sk-border);
  background-color: var(--sk-surface);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.sort-btn:hover {
  background-color: var(--sk-surface-hover);
}

.weather-grid {
  display: flex;
  gap: var(--sk-space-3);
  flex-wrap: wrap;
  /* 기본값 stretch면 한 카드의 상세보기가 열릴 때 같은 줄의 카드가 전부 같이 늘어난다.
     flex-start로 두면 펼쳐진 카드만 길어지고 나머지는 제자리에 있는다. */
  align-items: flex-start;
}
.weather-card {
  border-radius: 12px;
  padding: 16px 16px 16px 14px;
  min-width: 120px;
  text-align: center;
  cursor: pointer;
  box-shadow: var(--sk-shadow);
  border-left: 4px solid var(--sk-w-default);
  transition: transform 0.15s ease;
}
.weather-card:hover {
  transform: translateY(-3px);
}
.weather-card--matched {
  outline: 2px solid var(--sk-highlight);
  outline-offset: 2px;
}
.weather-card--selected {
  box-shadow:
    0 0 0 3px var(--sk-accent),
    var(--sk-shadow-lg);
}

/* 날씨 상태별 카드 색상 */
.weather-card--sunny {
  background: linear-gradient(160deg, var(--sk-w-sunny-bg) 0%, var(--sk-surface) 60%);
  border-left-color: var(--sk-w-sunny);
}
.weather-card--rain {
  background: linear-gradient(160deg, var(--sk-w-rain-bg) 0%, var(--sk-surface) 60%);
  border-left-color: var(--sk-w-rain);
}
.weather-card--cloud {
  background: linear-gradient(160deg, var(--sk-w-cloud-bg) 0%, var(--sk-surface) 60%);
  border-left-color: var(--sk-w-cloud);
}
.weather-card--overcast {
  background: linear-gradient(160deg, var(--sk-w-overcast-bg) 0%, var(--sk-surface) 60%);
  border-left-color: var(--sk-w-overcast);
}
.weather-card--default {
  background: linear-gradient(160deg, var(--sk-w-default-bg) 0%, var(--sk-surface) 60%);
}
.weather-card__name {
  font-weight: 700;
  color: var(--sk-text);
  margin: 0 0 4px;
}
.weather-card__temp {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 4px;
  color: var(--sk-text);
}
.weather-card__status {
  font-size: 13px;
  color: var(--sk-text-muted);
  margin: 0;
}

.detail-btn {
  margin-top: 10px;
  width: 100%;
  border: 1px solid var(--sk-border);
  background-color: var(--sk-surface);
  border-radius: 8px;
  padding: 6px 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.detail-btn:hover {
  background-color: var(--sk-surface-hover);
}
.weather-card__detail {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--sk-border);
  font-size: 13px;
  color: var(--sk-text);
}

.empty-message {
  color: var(--sk-danger);
  background-color: var(--sk-danger-weak);
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 14px;
}
</style>
