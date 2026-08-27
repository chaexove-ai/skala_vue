<script setup>
import { ref, computed } from 'vue'
import { statusIcon, isWet } from '@/data/weatherStatus.js'

// 1) 반응형 상태 관리: 도시별 날씨 데이터 배열 (특별시와 광역시, 수원, 부산, 전주 등 한국의 대표적인 나만의 도시 데이터로 확장하였음 )
const weatherList = ref([
  { id: 'city_01', name: '서울', temp: 28, status: '맑음', favorite: false },
  { id: 'city_02', name: '수원', temp: 24, status: '비', favorite: false },
  { id: 'city_03', name: '부산', temp: 26, status: '구름', favorite: false },
  { id: 'city_04', name: '전주', temp: 22, status: '흐림', favorite: false },
  { id: 'city_05', name: '제주', temp: 22, status: '맑음', favorite: false },
  { id: 'city_06', name: '대구', temp: 31, status: '맑음', favorite: false },
  { id: 'city_07', name: '인천', temp: 25, status: '흐림', favorite: false },
  { id: 'city_08', name: '광주', temp: 27, status: '맑음', favorite: false },
  { id: 'city_09', name: '대전', temp: 24, status: '비', favorite: false },
  { id: 'city_10', name: '울산', temp: 26, status: '구름', favorite: false },
  { id: 'city_11', name: '세종', temp: 23, status: '흐림', favorite: false },
])

// 실제 날씨 상태(status)에 맞는 아이콘은 weatherStatus.js의 공통 테이블에서 찾아 쓴다.
// (카드에 보이는 아이콘과 상세보기 alert 내용이 같은 정보를 가리키도록 하기 위함)

// 상태바에 표시할 선택된 도시명
const selectedCity = ref('')

// 3) 한글 검색 input용 변수 (v-model 대신 :value + @input으로 직접 구현)
const searchCity = ref('')
const handleSearchInput = (e) => {
  searchCity.value = e.target.value
}

// 4) 카드 클릭 -> 상태바 갱신
const selectCard = (name) => {
  selectedCity.value = name
}

// 한글 받침 유무에 따라 "이/가" 조사를 다르게 붙이기 위한 함수
// 완성형 한글 유니코드는 0xAC00~0xD7A3 범위이고, (코드 - 0xAC00) % 28 이 0이면 받침이 없는 글자임
const getSubjectParticle = (word) => {
  if (!word) return '이'
  const lastCharCode = word.charCodeAt(word.length - 1)
  if (lastCharCode < 0xac00 || lastCharCode > 0xd7a3) return '이'
  const hasBatchim = (lastCharCode - 0xac00) % 28 !== 0
  return hasBatchim ? '이' : '가'
}

// 6) 나만의 추가 기능: 카드에는 없는, 바로 행동으로 옮길 수 있는 생활 팁을
// 온도+상태 조합으로 계산해서 상세보기에 보여줌
const getWeatherTip = (status, temp) => {
  if (isWet(status)) return '☂️ 우산을 챙기세요'
  if (status === '맑음' && temp >= 25) return '🧴 자외선 차단제를 바르세요'
  if (status === '흐림' || status === '구름') return '🧥 얇은 겉옷을 챙기면 좋아요'
  return '🌤️ 나들이하기 좋은 날씨예요'
}

// 4) 상세보기 버튼 -> alert (부모 카드 클릭으로 버블링되지 않도록 .stop 사용)
const showDetail = (cityName, status, temp) => {
  const tip = getWeatherTip(status, temp)
  window.alert(`${cityName}의 현재 날씨는 [${status}] 상태입니다.\n\n${tip}`)
}

// [과제 2 학습 후 보완] 즐겨찾기 목록을 computed로 뽑아둔다.
// 원래는 템플릿에서 weatherList.filter(...)를 직접 호출했는데, 그러면 화면이 다시 그려질 때마다
// 배열이 새로 만들어진다. computed로 빼면 weatherList가 바뀔 때만 다시 계산된다.
const favoriteCities = computed(() => weatherList.value.filter((city) => city.favorite))

// 5) 나만의 추가 기능: 즐겨찾기(★) 토글기능 응용 (버튼 클릭으로 버블링되지 않도록 .stop 사용)
const toggleFavorite = (city) => {
  city.favorite = !city.favorite
}
</script>

<template>
  <div class="practice-section">
    <p class="exercise-meta">판교 · 5반 · 임채환 · 보관함 경로 <code>/archive/mockup</code></p>

    <!-- 보관함 페이지의 제목(히어로)이 h1이므로 여기서는 h2를 쓴다. 모양은 그대로다. -->
    <h2 class="page-title"><span class="page-title__badge">과제 1</span>⛅️Weather Mockup</h2>

    <!-- 3) 양방향 바인딩 및 한글 처리 -->
    <section class="search-box card-block">
      <h3>도시 이름 검색</h3>
      <input
        type="text"
        class="search-input"
        :value="searchCity"
        @input="handleSearchInput"
        placeholder="도시 이름을 입력해보세요"
      />
      <p>
        입력한 도시명: <strong>{{ searchCity || '-' }}</strong>
      </p>
    </section>

    <!-- 5) 나만의 추가 기능: 즐겨찾기한 도시만 따로 모아보기 -->
    <div v-if="favoriteCities.length > 0" class="favorite-box card-block">
      <h3>내가 즐겨찾기한 도시</h3>
      <p v-for="city in favoriteCities" :key="city.id">
        ★ {{ city.name }} ({{ city.temp }}°, {{ statusIcon(city.status) }} {{ city.status }})
      </p>
    </div>

    <!-- 1) v-for로 날씨 카드 반복 렌더링 -->
    <section class="weather-section card-block">
      <h3>지역별 날씨 현황</h3>

      <!-- 4) 이벤트: 카드 선택 상태바 -->
      <p class="status-bar">
        <span v-if="selectedCity"
          ><strong>{{ selectedCity }}</strong
          >{{ getSubjectParticle(selectedCity) }} 선택되었습니다.</span
        >
        <span v-else>카드를 클릭하면 여기에 선택된 도시가 표시됩니다.</span>
      </p>

      <div class="weather-grid">
        <div
          v-for="city in weatherList"
          :key="city.id"
          class="weather-card"
          :class="{
            'weather-card--highlight': searchCity.trim() && city.name.includes(searchCity.trim()),
            'weather-card--hot': city.temp >= 25,
          }"
          @click="selectCard(city.name)"
        >
          <div class="weather-card__header">
            <h3>{{ city.name }}</h3>
            <span class="weather-card__icon">{{ statusIcon(city.status) }}</span>
          </div>

          <p class="weather-card__temp">{{ city.temp }}°</p>
          <p class="weather-card__status">{{ city.status }}</p>

          <!-- 2) v-if / v-else로 온도 기준 라벨 분기 -->
          <p v-if="city.temp >= 25" class="weather-card__badge weather-card__badge--hot">
            🔥더움 (25도 이상)
          </p>
          <p v-else class="weather-card__badge weather-card__badge--cool">❄️선선함 (25도 미만)</p>

          <div class="weather-card__actions">
            <!-- 5) 나만의 추가 기능: 즐겨찾기 토글, 클릭이 카드 선택으로 안 번지도록 .stop -->
            <button
              class="weather-card__btn"
              :class="{ 'weather-card__btn--favorite': city.favorite }"
              :title="city.favorite ? '즐겨찾기에서 빼기' : '즐겨찾기에 추가하기'"
              @click.stop="toggleFavorite(city)"
            >
              {{ city.favorite ? '★ 즐겨찾기 해제' : '☆ 즐겨찾기 추가' }}
            </button>

            <!-- 4) 상세보기 버튼, 클릭이 카드 선택으로 안 번지도록 .stop -->
            <button
              class="weather-card__btn weather-card__btn--detail"
              title="이 도시의 날씨 상세 정보 보기"
              @click.stop="showDetail(city.name, city.status, city.temp)"
            >
              {{ statusIcon(city.status) }} 상세보기
            </button>
          </div>
        </div>
      </div>
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

.search-box h3 {
  font-weight: 700;
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
.search-box p {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--sk-text-muted);
}

.status-bar {
  background-color: var(--sk-surface-alt);
  border-radius: 8px;
  padding: 10px 14px;
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--sk-text-muted);
}
.status-bar strong {
  color: var(--sk-text);
  font-size: 14px;
}

.weather-grid {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.weather-card {
  position: relative;
  border-radius: 14px;
  padding: 18px;
  min-width: 160px;
  cursor: pointer;
  background: linear-gradient(160deg, var(--sk-w-default-bg) 0%, var(--sk-surface) 60%);
  box-shadow: var(--sk-shadow);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}
.weather-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}
.weather-card--hot {
  background: linear-gradient(160deg, #fff3e6 0%, var(--sk-surface) 60%);
}
.weather-card--highlight {
  outline: 2px solid var(--sk-highlight);
  outline-offset: 2px;
}

.weather-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.weather-card__header h3 {
  margin: 0;
  color: var(--sk-text);
}
.weather-card__icon {
  font-size: 22px;
}
.weather-card__temp {
  font-size: 32px;
  font-weight: 700;
  margin: 6px 0 0;
  color: var(--sk-text);
}
.weather-card__status {
  margin: 0 0 8px;
  color: var(--sk-text-muted);
  font-size: 13px;
}

.weather-card__badge {
  display: inline-block;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 999px;
  margin: 0 0 12px;
}
.weather-card__badge--hot {
  background-color: #ffe4cc;
  color: #b35c00;
}
.weather-card__badge--cool {
  background-color: var(--sk-accent-weak);
  color: var(--sk-accent);
}

.weather-card__actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
  padding-top: 10px;
  border-top: 1px dashed var(--sk-border);
}
.weather-card__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  border: 1px solid var(--sk-border);
  background-color: var(--sk-surface);
  border-radius: 8px;
  padding: 9px 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    transform 0.1s ease;
}
.weather-card__btn:hover {
  background-color: var(--sk-surface-hover);
}
.weather-card__btn:active {
  transform: scale(0.97);
}
.weather-card__btn:focus-visible {
  outline: 2px solid var(--sk-accent);
  outline-offset: 2px;
}
.weather-card__btn--favorite {
  border-color: var(--sk-w-sunny);
  background-color: var(--sk-w-sunny-bg);
  color: #7a5c00;
}
.weather-card__btn--favorite:hover {
  background-color: #fff1c2;
}
.weather-card__btn--detail {
  border: none;
  background-color: var(--sk-accent);
  color: var(--sk-text-invert);
}
.weather-card__btn--detail:hover {
  background-color: var(--sk-accent-hover);
}

.favorite-box {
  background-color: #fffaf0;
  border-color: #f5e2b8;
}
.favorite-box p {
  margin: 0 0 6px;
  font-size: 14px;
  color: #6b4e00;
}
.favorite-box p:last-child {
  margin-bottom: 0;
}
</style>
