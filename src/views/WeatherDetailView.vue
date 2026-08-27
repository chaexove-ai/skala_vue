<script setup>
// 과제 4-4) 지역별 상세 기상관측 정보 페이지
// URL의 동적 구간(:cityId)만 알고 있는 상태로 시작해서, Mount 시점에 Mock Data에서 도시 객체를 찾는다.
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { findCityById, fineDustGrade } from '@/data/weatherData.js'
import { useWeatherStore } from '@/stores/weatherStore.js'
import { MAP_LAYERS, DEFAULT_MAP_LAYER } from '@/data/mapLayers.js'
import { fetchAirPollution, fetchForecast } from '@/api/weatherApi.js'
import { statusMeta } from '@/data/weatherStatus.js'
import { useConfigStore } from '@/stores/configStore.js'
import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'
// 지도는 Leaflet 라이브러리를 끌고 오므로, 이 화면에 들어올 때만 내려받도록 동적 import를 쓴다.
// (과제 4에서 라우트에 적용한 지연 로딩을 컴포넌트 단위로도 적용한 것)
// 지도에 겹칠 레이어. 버튼은 카드 헤더에, 실제 그리기는 WeatherMap이 맡는다.
const mapLayer = ref(DEFAULT_MAP_LAYER)

const WeatherMap = defineAsyncComponent(() => import('@/components/exercise/WeatherMap.vue'))

// 라우터에서 props: true 로 넘겨준 동적 구간. useRoute() 없이 순수 props로 받는다.
const props = defineProps({
  cityId: { type: String, required: true },
})

const config = useConfigStore()
const weather = useWeatherStore()

// Mount 시점에 도시 객체를 선택한다. 못 찾으면 null로 두고 아래에서 안내 화면을 보여준다.
const city = ref(null)
const isLoading = ref(true)
const loadError = ref('') // 요청 실패 (도시가 목록에 없는 것과는 다른 상황)
const airQuality = ref(null) // 과제 6-2) 대기오염 API 결과
const forecast = ref([]) // 과제 6-2) 5일/3시간 예보 API 결과

// 과제 6) Mount 시점에 도시를 정하는 흐름은 과제 4와 같고, 값의 출처만 Mock에서 API로 바뀌었다.
//   1) 대시보드에서 넘어왔다면 스토어에 이미 받아둔 값이 있으므로 그대로 쓴다.
//   2) 주소로 바로 들어왔다면 스토어가 비어 있으므로 그 도시만 따로 호출한다.
// 기본 도시 목록과 사용자가 추가한 도시를 모두 뒤진다.
// (추가한 도시는 localStorage에 남아 있어서 주소로 바로 들어와도 찾을 수 있다)
const findTarget = (cityId) =>
  findCityById(cityId) ?? weather.extraCities.find((city) => city.id === cityId) ?? null

onMounted(async () => {
  const target = findTarget(props.cityId)
  if (!target) {
    isLoading.value = false
    console.log(`⚠️ [onMounted] 존재하지 않는 도시 코드: ${props.cityId}`)
    return
  }
  // 세 요청을 동시에 보낸다. 좌표는 요청 전에 이미 알고 있으므로 날씨 응답을 기다릴 이유가 없다.
  //
  // all이 아니라 allSettled를 쓰는 이유:
  // all은 하나만 실패해도 전체가 거부된다. 그러면 예보 호출이 잠깐 실패한 것만으로
  // 도시 정보까지 못 받은 셈이 되어 "도시를 찾을 수 없습니다" 화면이 떠버린다.
  // 세 값은 서로 독립적이므로 성공한 것만 반영하고, 실패한 칸은 비워두는 편이 맞다.
  const [cityRes, airRes, forecastRes] = await Promise.allSettled([
    weather.findById(props.cityId) ?? weather.loadCity(target),
    fetchAirPollution(target.lat, target.lon),
    fetchForecast(target.lat, target.lon),
  ])

  if (cityRes.status === 'fulfilled') {
    city.value = cityRes.value
    console.log(`📄 [onMounted] 상세 페이지 진입 → ${city.value.name} (${props.cityId})`)
  } else {
    // 도시는 목록에 있는데 값을 못 받아온 경우. "도시가 없다"와는 다른 상황이라 따로 안내한다.
    loadError.value = '날씨 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
    console.error('[상세] 날씨 조회 실패:', cityRes.reason?.message)
  }
  if (airRes.status === 'fulfilled') airQuality.value = airRes.value
  else console.error('[상세] 대기오염 조회 실패:', airRes.reason?.message)
  if (forecastRes.status === 'fulfilled') forecast.value = forecastRes.value
  else console.error('[상세] 예보 조회 실패:', forecastRes.reason?.message)

  isLoading.value = false
})

const meta = computed(() => (city.value ? statusMeta(city.value.status) : null))
// 체감 온도는 이제 우리가 계산하지 않고 API가 준 feels_like 값을 그대로 쓴다.
const feelsLike = computed(() => city.value?.observation.feelsLike ?? null)
// 예보는 3시간 간격 40건이 온다. 화면에는 앞의 8건(24시간)만 쓴다.
const nextHours = computed(() =>
  forecast.value.slice(0, 8).map((item) => ({
    ...item,
    // '2026-08-27 15:00:00' → '15시'
    label: `${item.time.slice(11, 13)}시`,
    icon: statusMeta(item.status).icon,
  })),
)
const maxForecastTemp = computed(() => Math.max(...nextHours.value.map((h) => h.temp), 0))
const minForecastTemp = computed(() => Math.min(...nextHours.value.map((h) => h.temp), 99))

// 일출·일몰 시각. 현재 날씨 응답에 이미 들어 있어서 따로 호출하지 않는다.
const sunTimes = computed(() => {
  const o = city.value?.observation
  if (!o?.sunrise) return null
  const fmt = (unix) =>
    new Date(unix * 1000).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  return { rise: fmt(o.sunrise), set: fmt(o.sunset) }
})

// 서버가 준 관측 시각(Unix seconds)을 사람이 읽는 형태로 바꾼다.
const observedText = computed(() => {
  const dt = city.value?.observation.observedAt
  if (!dt) return ''
  const at = new Date(dt * 1000)
  return `${at.toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 기준`
})

// 미세먼지 등급을 Element Plus의 태그 색으로 옮긴다.
// 좋음/보통/나쁨을 글자로만 쓰면 훑어볼 때 눈에 안 들어와서, 색이 붙은 태그로 보여준다.
const DUST_TAG_TYPE = { good: 'success', normal: 'info', bad: 'warning', worst: 'danger' }

const dust = computed(() => (airQuality.value ? fineDustGrade(airQuality.value.pm10) : null))

// 관측 항목을 배열로 두면 마크업이 v-for 한 줄로 끝나고, 항목을 추가하기도 쉽다.
const observationRows = computed(() => {
  if (!city.value) return []
  const o = city.value.observation
  return [
    {
      label: '체감 온도',
      // 원본은 항상 섭씨이고, 스토어의 getter가 현재 단위로 바꿔준다.
      value: `${config.displayTemp(feelsLike.value)}${config.unitSymbol}`,
      hint: 'API가 준 feels_like 값',
    },
    {
      label: '최저 / 최고',
      value: `${config.displayTemp(o.tempMin)} / ${config.displayTemp(o.tempMax)}${config.unitSymbol}`,
      hint: '오늘 예상 범위',
    },
    {
      label: '습도',
      value: `${o.humidity}%`,
      hint: o.humidity >= 80 ? '높음 — 눅눅할 수 있어요' : '보통',
    },
    {
      label: '풍속',
      value: `${o.windSpeed} m/s`,
      hint: o.windSpeed >= 5 ? '바람이 강한 편' : '잔잔한 편',
    },
    {
      label: '미세먼지 (PM10)',
      value: airQuality.value ? `${airQuality.value.pm10} ㎍/㎥` : null,
      hint: '대기오염 API 실측값',
      tag: dust.value ? { text: dust.value.label, type: DUST_TAG_TYPE[dust.value.tone] } : null,
    },
    {
      label: '초미세먼지 (PM2.5)',
      value: airQuality.value ? `${airQuality.value.pm25} ㎍/㎥` : null,
      hint: '대기오염 API 실측값',
    },
    {
      label: '일출 / 일몰',
      value: sunTimes.value ? `${sunTimes.value.rise} / ${sunTimes.value.set}` : '-',
      hint: '이 도시의 해가 뜨고 지는 시각',
    },
  ]
})
</script>

<template>
  <!-- 불러오는 동안 보여줄 화면.
       이 분기가 없으면 city가 채워지기 전까지 아래 "도시를 찾을 수 없습니다"가 먼저 뜬다.
       (요청이 실패한 것이 아니라 아직 안 온 것인데, 화면은 없는 것처럼 말하고 있었다) -->
  <div v-if="isLoading" class="loading">
    <el-skeleton :rows="3" animated />
    <el-skeleton style="margin-top: 24px" :rows="5" animated />
  </div>

  <div v-else-if="city">
    <BaseDashboardCard>
      <div class="detail-head">
        <div>
          <p class="detail-head__name">{{ city.name }}</p>
          <p class="detail-head__status">{{ city.status }}{{ meta.icon }}</p>
        </div>
        <p class="detail-head__temp sk-num">
          {{ config.displayTemp(city.temp) }}{{ config.unitSymbol }}
        </p>
      </div>
      <p class="detail-head__observed">{{ observedText }} · OpenWeatherMap 실시간 데이터</p>
    </BaseDashboardCard>

    <BaseDashboardCard title="상세 관측 정보">
      <template #badge>{{ observationRows.length }}개 항목</template>
      <dl class="obs">
        <div v-for="row in observationRows" :key="row.label" class="obs__row">
          <dt class="obs__label">{{ row.label }}</dt>
          <dd class="obs__value sk-num">
            <!-- 아직 응답이 안 온 값은 "불러오는 중" 글자 대신 자리만 잡아둔다. -->
            <el-skeleton-item v-if="row.value === null" variant="h1" style="width: 70%" />
            <span v-else>{{ row.value }}</span>
          </dd>
          <dd class="obs__hint">
            <el-tag v-if="row.tag" :type="row.tag.type" size="small" effect="light">
              {{ row.tag.text }}
            </el-tag>
            <span v-else>{{ row.hint }}</span>
          </dd>
        </div>
      </dl>
    </BaseDashboardCard>

    <BaseDashboardCard title="지도">
      <template #badge>OpenStreetMap</template>
      <!-- 레이어 선택은 지도 안이 아니라 카드 헤더 오른쪽에 둔다.
           지도 위에 작게 얹으면 눌러야 할 것인지 알기 어렵고, 지도를 끌 때 방해가 된다. -->
      <template #actions>
        <el-radio-group v-model="mapLayer">
          <el-radio-button v-for="layer in MAP_LAYERS" :key="layer.key" :value="layer.key">
            {{ layer.label }}
          </el-radio-button>
        </el-radio-group>
      </template>
      <WeatherMap :lat="city.lat" :lon="city.lon" :name="city.name" :layer="mapLayer" />
    </BaseDashboardCard>

    <BaseDashboardCard v-if="nextHours.length > 0" title="앞으로 24시간">
      <template #badge>3시간 간격</template>
      <ul class="forecast">
        <li v-for="hour in nextHours" :key="hour.time" class="forecast__item">
          <span class="forecast__time">{{ hour.label }}</span>
          <span class="forecast__icon">{{ hour.icon }}</span>
          <span class="forecast__temp sk-num">
            {{ config.displayTemp(hour.temp) }}{{ config.unitSymbol }}
          </span>
          <span class="forecast__pop" :class="{ 'forecast__pop--high': hour.pop >= 60 }">
            💧 {{ hour.pop }}%
          </span>
        </li>
      </ul>
      <p class="forecast__note">
        기온 범위 {{ config.displayTemp(minForecastTemp) }}~{{ config.displayTemp(maxForecastTemp)
        }}{{ config.unitSymbol }} · 💧는 강수 확률입니다.
      </p>
    </BaseDashboardCard>

    <div class="detail-actions">
      <!-- 돌아가기는 '주소로 이동'이 전부라 선언형 RouterLink를 쓴다. -->
      <RouterLink to="/" class="btn btn--primary">← 메인 대시보드로 돌아가기</RouterLink>
    </div>
  </div>

  <!-- 주소는 규칙에 맞지만(/weather/xxx) 그런 도시가 없는 경우: 404가 아니라 이 화면이 안내한다. -->
  <BaseDashboardCard v-else>
    <el-result
      icon="warning"
      title="도시를 찾을 수 없습니다"
      :sub-title="`${cityId} 에 해당하는 도시가 목록에 없습니다.`"
    >
      <template #extra>
        <RouterLink to="/">
          <el-button type="primary">메인 대시보드로 돌아가기</el-button>
        </RouterLink>
      </template>
    </el-result>
  </BaseDashboardCard>
</template>

<style scoped>
.loading {
  padding: var(--sk-space-4) 0;
}
.forecast {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
  gap: var(--sk-space-3);
}
.forecast__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sk-space-2);
  padding: var(--sk-space-4) var(--sk-space-2);
  border: 1px solid var(--sk-border);
  border-radius: var(--sk-radius);
  background-color: var(--sk-surface);
}
.forecast__time {
  font-size: var(--sk-text-sm);
  font-weight: 700;
  color: var(--sk-text-muted);
}
.forecast__icon {
  font-size: var(--sk-text-lg);
}
.forecast__temp {
  font-size: var(--sk-text-lg);
  font-weight: 800;
}
.forecast__pop {
  font-size: var(--sk-text-xs);
  color: var(--sk-text-muted);
}
.forecast__pop--high {
  color: var(--sk-w-rain);
  font-weight: 700;
}
.forecast__note {
  margin: var(--sk-space-4) 0 0;
  font-size: var(--sk-text-xs);
  color: var(--sk-text-muted);
}
.detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sk-space-4);
}
.detail-head__name {
  margin: 0;
  font-size: var(--sk-text-3xl);
  font-weight: 800;
}
.detail-head__status {
  margin: var(--sk-space-2) 0 0;
  color: var(--sk-text-muted);
  font-size: var(--sk-text-lg);
}
.detail-head__temp {
  margin: 0;
  font-size: var(--sk-text-display);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
}
.detail-head__observed {
  margin: var(--sk-space-5) 0 0;
  font-size: var(--sk-text-sm);
  color: var(--sk-text-muted);
}

.obs {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--sk-space-4);
}
.obs__row {
  border: 1px solid var(--sk-border);
  border-radius: var(--sk-radius);
  padding: var(--sk-space-5);
  background-color: var(--sk-surface);
}
.obs__label {
  margin: 0;
  font-size: var(--sk-text-sm);
  color: var(--sk-text-muted);
  font-weight: 600;
}
.obs__value {
  margin: var(--sk-space-2) 0 0;
  font-size: var(--sk-text-2xl);
  font-weight: 800;
  letter-spacing: -0.02em;
}
.obs__hint {
  margin: var(--sk-space-2) 0 0;
  font-size: var(--sk-text-sm);
  color: var(--sk-text-muted);
}

.detail-actions {
  display: flex;
  gap: var(--sk-space-2);
  flex-wrap: wrap;
}
.btn {
  display: inline-block;
  border: 1px solid var(--sk-border);
  border-radius: var(--sk-radius);
  padding: var(--sk-space-3) var(--sk-space-6);
  font-size: var(--sk-text-md);
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
}
.btn--primary {
  background-color: var(--sk-accent);
  border-color: var(--sk-accent);
  color: var(--sk-text-invert);
}
.btn--primary:hover {
  background-color: var(--sk-accent-hover);
}
.empty {
  margin: 0 0 var(--sk-space-4);
  color: var(--sk-text-muted);
  font-size: var(--sk-text-base);
}
.empty code {
  background-color: var(--sk-surface-hover);
  border-radius: var(--sk-radius-sm);
  padding: 2px 6px;
}
</style>
