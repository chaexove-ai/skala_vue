<script setup>
// 과제 4-6) 본인의 추가 view: 도시 전체의 기온 분포와 날씨 상태 구성을 집계해서 보여준다.
// 새 데이터를 만들지 않고, 대시보드와 같은 Mock Data를 computed로 요약하기만 한다.
import { computed } from 'vue'
import { CITY_WEATHER } from '@/data/weatherData.js'
import { statusMeta } from '@/data/weatherStatus.js'
import { useConfigStore } from '@/stores/configStore.js'
import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'

// 기온대별 색. 순위(몇 번째인가)가 아니라 실제 기온으로 칠한다.
// 순위로 칠하면 모든 도시가 30°인 날에도 꼴찌가 파랗게 보여서 그래프가 사실과 어긋난다.
const TEMP_BANDS = [
  { min: 30, from: 30, to: null, color: 'var(--sk-temp-hot)' },
  { min: 27, from: 27, to: 29, color: 'var(--sk-temp-warm)' },
  { min: 24, from: 24, to: 26, color: 'var(--sk-temp-mild)' },
  { min: 21, from: 21, to: 23, color: 'var(--sk-temp-cool)' },
  { min: -Infinity, from: null, to: 20, color: 'var(--sk-temp-cold)' },
]
const bandOf = (temp) => TEMP_BANDS.find((band) => temp >= band.min)

// 범례에는 실제로 등장한 기온대만 보여준다. (아무 도시도 없는 구간까지 나열하면 오히려 헷갈린다)
// 구간 경계도 현재 단위로 바꿔서 보여준다. (구간 자체는 섭씨 기준으로 판정)
const bandLabel = (band) => {
  const unit = config.unitSymbol
  if (band.to === null) return `${config.displayTemp(band.from)}${unit} 이상`
  if (band.from === null) return `${config.displayTemp(band.to)}${unit} 이하`
  return `${config.displayTemp(band.from)}~${config.displayTemp(band.to)}${unit}`
}

const usedBands = computed(() =>
  TEMP_BANDS.filter((band) => CITY_WEATHER.some((city) => bandOf(city.temp) === band)),
)

const config = useConfigStore()

const temps = computed(() => CITY_WEATHER.map((city) => city.temp))
const maxTemp = computed(() => Math.max(...temps.value))
const minTemp = computed(() => Math.min(...temps.value))

// 최고/최저가 동점인 도시가 있을 수 있으므로 filter로 모두 모은다. (전주·제주가 둘 다 22°)
const hottest = computed(() => CITY_WEATHER.filter((c) => c.temp === maxTemp.value))
const coldest = computed(() => CITY_WEATHER.filter((c) => c.temp === minTemp.value))
const avgTemp = computed(
  () => Math.round((temps.value.reduce((sum, t) => sum + t, 0) / temps.value.length) * 10) / 10,
)

// 날씨 상태별 도시 수. 막대 길이는 가장 많은 상태를 100%로 잡아 상대 비율로 그린다.
const statusCounts = computed(() => {
  const counts = new Map()
  for (const city of CITY_WEATHER) counts.set(city.status, (counts.get(city.status) ?? 0) + 1)
  const rows = [...counts].map(([status, count]) => ({
    status,
    count,
    icon: statusMeta(status).icon,
  }))
  return rows.sort((a, b) => b.count - a.count)
})
const topCount = computed(() => statusCounts.value[0]?.count ?? 1)

// 기온 순으로 정렬한 전체 목록. 막대 길이는 최저~최고 구간을 0~100%로 환산한다.
const ranked = computed(() =>
  [...CITY_WEATHER]
    .sort((a, b) => b.temp - a.temp)
    .map((city) => ({
      ...city,
      icon: statusMeta(city.status).icon,
      color: bandOf(city.temp).color,
      // 최저 기온 도시는 비율이 0이라 막대가 사라지므로, 그릴 때 최소 6%는 채운다.
      ratio:
        maxTemp.value === minTemp.value
          ? 100
          : Math.round(((city.temp - minTemp.value) / (maxTemp.value - minTemp.value)) * 100),
    })),
)
</script>

<template>
  <div>
    <BaseDashboardCard title="기온 요약">
      <template #badge>{{ CITY_WEATHER.length }}개 도시</template>
      <div class="summary">
        <div class="summary__item">
          <p class="summary__label">최고</p>
          <p class="summary__value sk-num">
            {{ config.displayTemp(maxTemp) }}{{ config.unitSymbol }}
          </p>
          <p class="summary__sub">{{ hottest.map((c) => c.name).join(' · ') }}</p>
        </div>
        <div class="summary__item">
          <p class="summary__label">최저</p>
          <p class="summary__value sk-num">
            {{ config.displayTemp(minTemp) }}{{ config.unitSymbol }}
          </p>
          <p class="summary__sub">{{ coldest.map((c) => c.name).join(' · ') }}</p>
        </div>
        <div class="summary__item">
          <p class="summary__label">평균</p>
          <p class="summary__value sk-num">
            {{ config.displayTemp(avgTemp) }}{{ config.unitSymbol }}
          </p>
          <p class="summary__sub">전체 도시 평균</p>
        </div>
        <div class="summary__item">
          <p class="summary__label">기온 차</p>
          <!-- 기온 "차이"는 변환식이 달라서 displayDiff를 쓴다 (5℃ 차이 = 9℉ 차이) -->
          <p class="summary__value sk-num">
            {{ config.displayDiff(maxTemp - minTemp) }}{{ config.unitSymbol }}
          </p>
          <p class="summary__sub">최고와 최저의 격차</p>
        </div>
      </div>
    </BaseDashboardCard>

    <BaseDashboardCard title="날씨 상태 구성">
      <template #badge>{{ statusCounts.length }}종</template>
      <ul class="bars">
        <li v-for="row in statusCounts" :key="row.status" class="bars__row">
          <span class="bars__name">{{ row.icon }} {{ row.status }}</span>
          <span class="bars__track">
            <span class="bars__fill" :style="{ width: `${(row.count / topCount) * 100}%` }" />
          </span>
          <span class="bars__count sk-num">{{ row.count }}곳</span>
        </li>
      </ul>
    </BaseDashboardCard>

    <BaseDashboardCard title="도시별 기온 순위">
      <template #badge>높은 순</template>
      <ol class="rank">
        <li v-for="(city, index) in ranked" :key="city.id" class="rank__row">
          <span class="rank__no sk-num">{{ index + 1 }}</span>
          <!-- 통계에서 바로 상세 페이지로 넘어갈 수 있게 RouterLink로 연결 -->
          <RouterLink :to="`/weather/${city.id}`" class="rank__name">
            {{ city.name }} {{ city.icon }}
          </RouterLink>
          <span class="rank__track">
            <span
              class="rank__fill"
              :style="{ width: `${Math.max(6, city.ratio)}%`, backgroundColor: city.color }"
            />
          </span>
          <span class="rank__temp sk-num">
            {{ config.displayTemp(city.temp) }}{{ config.unitSymbol }}
          </span>
        </li>
      </ol>

      <ul class="legend">
        <li v-for="band in usedBands" :key="band.min" class="legend__item">
          <span class="legend__swatch" :style="{ backgroundColor: band.color }" />
          {{ bandLabel(band) }}
        </li>
      </ul>
    </BaseDashboardCard>
  </div>
</template>

<style scoped>
.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--sk-space-3);
}
.summary__item {
  border: 1px solid var(--sk-border);
  border-radius: var(--sk-radius);
  padding: var(--sk-space-3) var(--sk-space-4);
  background-color: var(--sk-surface);
}
.summary__label {
  margin: 0;
  font-size: var(--sk-text-xs);
  font-weight: 700;
  color: var(--sk-text-muted);
}
.summary__value {
  margin: var(--sk-space-1) 0 0;
  font-size: var(--sk-text-2xl);
  font-weight: 800;
  line-height: 1.1;
}
.summary__sub {
  margin: var(--sk-space-1) 0 0;
  font-size: var(--sk-text-xs);
  color: var(--sk-text-muted);
}

.bars,
.rank {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sk-space-2);
}
.bars__row,
.rank__row {
  display: flex;
  align-items: center;
  gap: var(--sk-space-3);
  font-size: var(--sk-text-sm);
}
.bars__name {
  width: 90px;
  flex-shrink: 0;
  font-weight: 600;
}
.bars__track,
.rank__track {
  flex: 1;
  height: 10px;
  border-radius: var(--sk-radius-pill);
  background-color: var(--sk-surface-hover);
  overflow: hidden;
}
.bars__fill,
.rank__fill {
  display: block;
  height: 100%;
  border-radius: var(--sk-radius-pill);
  background-color: var(--sk-accent);
}
.bars__count,
.rank__temp {
  width: 48px;
  text-align: right;
  flex-shrink: 0;
  font-weight: 700;
}
.legend {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: var(--sk-space-4);
  margin: var(--sk-space-5) 0 0;
  padding-top: var(--sk-space-4);
  border-top: 1px solid var(--sk-border);
  font-size: var(--sk-text-xs);
  color: var(--sk-text-muted);
}
.legend__item {
  display: flex;
  align-items: center;
  gap: var(--sk-space-2);
}
.legend__swatch {
  width: 14px;
  height: 14px;
  border-radius: 4px;
}

.rank__no {
  width: 20px;
  color: var(--sk-text-muted);
  font-size: var(--sk-text-xs);
  text-align: right;
  flex-shrink: 0;
}
.rank__name {
  width: 90px;
  flex-shrink: 0;
  font-weight: 600;
  color: var(--sk-text);
  text-decoration: none;
}
.rank__name:hover {
  color: var(--sk-accent);
  text-decoration: underline;
}
</style>
