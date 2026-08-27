<script setup>
// 과제 4-4) 지역별 상세 기상관측 정보 페이지
// URL의 동적 구간(:cityId)만 알고 있는 상태로 시작해서, Mount 시점에 Mock Data에서 도시 객체를 찾는다.
import { ref, computed, onMounted } from 'vue'
import { findCityById, fineDustGrade, OBSERVED_AT } from '@/data/weatherData.js'
import { statusMeta } from '@/data/weatherStatus.js'
import { useConfigStore } from '@/stores/configStore.js'
import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'

// 라우터에서 props: true 로 넘겨준 동적 구간. useRoute() 없이 순수 props로 받는다.
const props = defineProps({
  cityId: { type: String, required: true },
})

// Mount 시점에 도시 객체를 선택한다. 못 찾으면 null로 두고 아래에서 안내 화면을 보여준다.
const city = ref(null)
onMounted(() => {
  city.value = findCityById(props.cityId)
  console.log(
    city.value
      ? `📄 [onMounted] 상세 페이지 진입 → ${city.value.name} (${props.cityId})`
      : `⚠️ [onMounted] 존재하지 않는 도시 코드: ${props.cityId}`,
  )
})

const config = useConfigStore()

const meta = computed(() => (city.value ? statusMeta(city.value.status) : null))
const feelsLike = computed(() =>
  city.value ? city.value.temp + statusMeta(city.value.status).feelsAdjust : null,
)
const dust = computed(() => (city.value ? fineDustGrade(city.value.observation.fineDust) : null))

// 관측 항목을 배열로 두면 마크업이 v-for 한 줄로 끝나고, 항목을 추가하기도 쉽다.
const observationRows = computed(() => {
  if (!city.value) return []
  const o = city.value.observation
  return [
    {
      label: '체감 온도',
      // 원본은 항상 섭씨이고, 스토어의 getter가 현재 단위로 바꿔준다.
      value: `${config.displayTemp(feelsLike.value)}${config.unitSymbol}`,
      hint: '기온과 날씨 상태를 조합한 계산값',
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
      label: '강수 확률',
      value: `${o.rainChance}%`,
      hint: o.rainChance >= 60 ? '우산을 챙기세요' : '우산 없이도 무난',
    },
    { label: '미세먼지', value: `${o.fineDust} ㎍/㎥`, hint: dust.value.label },
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
      <p class="detail-head__observed">{{ OBSERVED_AT }}</p>
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

    <div class="detail-actions">
      <!-- 돌아가기는 '주소로 이동'이 전부라 선언형 RouterLink를 쓴다. -->
      <RouterLink to="/" class="btn btn--primary">← 메인 대시보드로 돌아가기</RouterLink>
    </div>
  </div>

  <!-- 주소는 규칙에 맞지만(/weather/xxx) 그런 도시가 없는 경우: 404가 아니라 이 화면이 안내한다. -->
  <BaseDashboardCard v-else title="도시를 찾을 수 없습니다">
    <p class="empty">
      <code>{{ cityId }}</code> 에 해당하는 도시가 Mock Data에 없습니다.
    </p>
    <RouterLink to="/" class="btn btn--primary">메인 대시보드로 돌아가기</RouterLink>
  </BaseDashboardCard>
</template>

<style scoped>
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
