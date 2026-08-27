<script setup>
// 과제 4-4) 지역별 상세 기상관측 정보 페이지
// URL의 동적 구간(:cityId)만 알고 있는 상태로 시작해서, Mount 시점에 Mock Data에서 도시 객체를 찾는다.
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { findCityById, fineDustGrade } from '@/data/weatherData.js'
import { useWeatherStore } from '@/stores/weatherStore.js'
import { fetchAirPollution, fetchForecast } from '@/api/weatherApi.js'
import { statusMeta } from '@/data/weatherStatus.js'
import { useConfigStore } from '@/stores/configStore.js'
import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'
// 지도는 Leaflet 라이브러리를 끌고 오므로, 이 화면에 들어올 때만 내려받도록 동적 import를 쓴다.
// (과제 4에서 라우트에 적용한 지연 로딩을 컴포넌트 단위로도 적용한 것)
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
  try {
    city.value = weather.findById(props.cityId) ?? (await weather.loadCity(target))
    console.log(`📄 [onMounted] 상세 페이지 진입 → ${city.value.name} (${props.cityId})`)

    // 대기오염과 예보는 서로 다른 엔드포인트다. 순서대로 기다릴 이유가 없으므로
    // Promise.all로 동시에 보낸다. (하나씩 await하면 두 배로 기다리게 된다)
    const [air, hours] = await Promise.all([
      fetchAirPollution(target.lat, target.lon),
      fetchForecast(target.lat, target.lon),
    ])
    airQuality.value = air
    forecast.value = hours
  } catch (error) {
    console.error('[상세] 날씨 조회 실패:', error.message)
  } finally {
    isLoading.value = false
  }
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
      value: airQuality.value ? `${airQuality.value.pm10} ㎍/㎥` : '불러오는 중',
      hint: dust.value?.label ?? '대기오염 API 조회 중',
    },
    {
      label: '초미세먼지 (PM2.5)',
      value: airQuality.value ? `${airQuality.value.pm25} ㎍/㎥` : '불러오는 중',
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
  <div v-if="city">
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
          <dd class="obs__value sk-num">{{ row.value }}</dd>
          <dd class="obs__hint">{{ row.hint }}</dd>
        </div>
      </dl>
    </BaseDashboardCard>

    <BaseDashboardCard title="지도">
      <template #badge>OpenStreetMap + 날씨 레이어</template>
      <WeatherMap :lat="city.lat" :lon="city.lon" :name="city.name" />
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
  <BaseDashboardCard v-else title="도시를 찾을 수 없습니다">
    <p class="empty">
      <code>{{ cityId }}</code> 에 해당하는 도시가 목록에 없습니다. 주소를 확인하거나 대시보드에서
      다시 선택해 주세요.
    </p>
    <RouterLink to="/" class="btn btn--primary">메인 대시보드로 돌아가기</RouterLink>
  </BaseDashboardCard>
</template>

<style scoped>
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
