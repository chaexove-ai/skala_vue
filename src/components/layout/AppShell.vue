<script setup>
// 앱 전체의 뼈대: 헤더(브랜드 + 내비 + 액션) / 히어로 / 본문 / 푸터
// 화면마다 이 구조를 반복해서 짜지 않도록 껍데기만 여기서 책임지고, 내용은 slot으로 받는다.
//
// slot 구성
//   #nav     : 화면 전환 메뉴 (<RouterLink> 목록)
//   #actions : 헤더 우측 액션 영역 (℃/℉ 단위 토글)
//   기본     : 본문
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useWeatherStore } from '@/stores/weatherStore.js'
import { useDashboardStore } from '@/stores/dashboardStore.js'
import { useConfigStore } from '@/stores/configStore.js'

defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
})

// 히어로 윗줄에는 지금 시각을 표시한다. 날씨 화면에서 "언제 기준 정보인가"는
// 실제로 필요한 정보라서, 분이 바뀔 때마다 갱신한다.
const route = useRoute()
const weather = useWeatherStore()
const dashboard = useDashboardStore()
const config = useConfigStore()

// 현재 위치는 사이트를 열자마자 묻지 않는다.
// 예전에는 onMounted에서 바로 물어봤는데, 사용자는 화면을 보기도 전에 "내 위치 확인" 권한창을
// 만나게 된다. 무엇에 쓰는지 모르는 상태에서 위치를 내주는 사람은 없으므로 대개 거절로 끝나고,
// 브라우저는 한 번 거절한 사이트에 다시 묻지 않아서 그 뒤로는 물어볼 기회조차 없어진다.
// 그래서 왜 필요한지 먼저 보여주고, 사용자가 버튼을 눌렀을 때 그때 요청한다.
const askMyLocation = () => weather.detectMyLocation()

// 어떤 빌드가 지금 떠 있는지. 배포한 뒤 "이게 방금 올린 그 빌드가 맞나"를 확인할 방법이 없으면
// 캐시된 옛 화면을 보면서 고쳐지지 않았다고 착각하게 된다. 푸터에 한 칸 내어 적어둔다.
// VITE_APP_MODE는 .env.staging / .env.production 에서 오고, 없으면 Vite 기본값(MODE)을 쓴다.
const buildMode = import.meta.env.VITE_APP_MODE || import.meta.env.MODE
console.log(`[빌드] 모드=${buildMode} · API=${import.meta.env.VITE_API_URL ?? '(기본값)'}`)

// 히어로에 띄울 곳: 현재 위치를 알아냈으면 그곳, 아니면 고른 도시, 그것도 없으면 목록의 첫 도시.
// 접속한 사람이 지금 서 있는 자리의 날씨를 먼저 보여주는 것이 자연스럽다고 봤다.
const heroCity = computed(
  () => weather.myLocation ?? weather.findById(dashboard.selectedCityId) ?? weather.list[0] ?? null,
)
const isMyLocation = computed(() => heroCity.value === weather.myLocation)

const now = ref(new Date())
let clockId = null
onMounted(() => {
  clockId = setInterval(() => (now.value = new Date()), 30_000)
})
onUnmounted(() => {
  // 타이머를 정리하지 않으면 컴포넌트가 사라져도 백그라운드에서 계속 돈다.
  clearInterval(clockId)
})

const stamp = computed(() =>
  now.value.toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }),
)

// 히어로 배경. 예전에는 시각을 6/9/17/20시로 임의로 나눴는데,
// 이제 API가 실제 일출·일몰 시각을 주므로 그 기준으로 낮과 밤을 가른다.
// (일출 전후 1시간은 새벽, 일몰 전후 1시간은 해질녘)
const HOUR = 60 * 60
const timeOfDay = computed(() => {
  const o = heroCity.value?.observation
  const seconds = now.value.getTime() / 1000

  // 아직 데이터를 못 받았으면 예전처럼 시각만 보고 정한다.
  if (!o?.sunrise) {
    const hour = now.value.getHours()
    return hour < 6 || hour >= 20 ? 'night' : hour < 9 ? 'dawn' : hour < 17 ? 'day' : 'dusk'
  }

  if (seconds < o.sunrise - HOUR || seconds > o.sunset + HOUR) return 'night'
  if (seconds < o.sunrise + HOUR) return 'dawn'
  if (seconds > o.sunset - HOUR) return 'dusk'
  return 'day'
})
</script>

<template>
  <div class="shell">
    <header class="shell__bar">
      <div class="shell__inner shell__bar-inner">
        <p class="brand">
          <span class="brand__mark" aria-hidden="true">☁</span>
          <span class="brand__name">판교_5반_임채환</span>
          <span class="brand__sub">Weather Dashboard</span>
        </p>

        <nav class="shell__nav"><slot name="nav" /></nav>
        <div class="shell__actions"><slot name="actions" /></div>
      </div>
    </header>

    <section class="hero" :class="`hero--${timeOfDay}`">
      <div class="shell__inner">
        <p class="hero__eyebrow">{{ stamp }} 기준</p>
        <h1 v-if="title" class="hero__title">{{ title }}</h1>
        <p v-if="subtitle" class="hero__subtitle">{{ subtitle }}</p>

        <!-- 지금 보고 있는 도시의 실제 날씨. 제목만 있던 히어로에 살아있는 값을 채운다. -->
        <div v-if="heroCity && route.meta.showLiveWeather" class="hero__live">
          <p v-if="isMyLocation" class="hero__badge">📍 현재 위치</p>
          <div class="hero__row">
            <span class="hero__city">{{ heroCity.name }}</span>
            <span class="hero__temp sk-num">
              {{ config.displayTemp(heroCity.temp) }}{{ config.unitSymbol }}
            </span>
          </div>

          <!-- 권한을 요청하기 전에 무엇에 쓰는지 먼저 밝힌다.
               브라우저 권한창은 "내 위치 확인"이라고만 말할 뿐 용도를 설명해주지 않으므로,
               그 설명은 이 자리에서 해야 한다. 요청은 사용자가 눌렀을 때만 나간다. -->
          <p v-if="weather.locationStatus === 'idle'" class="hero__ask">
            <span class="hero__ask-text"
              >지금은 <strong>{{ heroCity.name }}</strong> 기준입니다.</span
            >
            <button class="hero__ask-btn" @click="askMyLocation">
              📍 내가 있는 곳의 날씨로 보기
            </button>
          </p>
          <p v-else-if="weather.locationStatus === 'asking'" class="hero__ask">
            <span class="hero__ask-text">위치를 확인하는 중입니다…</span>
          </p>
          <p v-else-if="weather.locationStatus === 'denied'" class="hero__ask">
            <span class="hero__ask-text">
              위치를 가져오지 못해 {{ heroCity.name }} 기준으로 보여드립니다.
            </span>
            <button class="hero__ask-btn" @click="askMyLocation">다시 시도</button>
          </p>
        </div>
      </div>
    </section>

    <main class="shell__inner shell__main">
      <slot />
    </main>

    <footer class="shell__foot">
      <div class="shell__inner shell__foot-inner">
        <span>SKALA Vue.js 실습 과제 — 판교_5반_임채환</span>
        <span class="shell__foot-dim">Vue 3 · Vue Router · Pinia · Vite · {{ buildMode }}</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--sk-bg);
}
/* 헤더·히어로·본문·푸터가 같은 세로선에 맞도록 폭을 한 곳에서 통제 */
.shell__inner {
  width: 100%;
  max-width: var(--sk-container);
  margin: 0 auto;
  padding: 0 var(--sk-space-6);
}

/* --- 헤더 --- */
.shell__bar {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--sk-border);
}
.shell__bar-inner {
  display: flex;
  align-items: center;
  gap: var(--sk-space-6);
  min-height: 60px;
  flex-wrap: wrap;
}
.brand {
  display: flex;
  align-items: baseline;
  gap: var(--sk-space-2);
  margin: 0;
  flex-shrink: 0;
}
.brand__mark {
  font-size: var(--sk-text-lg);
}
.brand__name {
  font-size: var(--sk-text-md);
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--sk-text);
}
.brand__sub {
  font-size: var(--sk-text-xs);
  font-weight: 600;
  color: var(--sk-text-muted);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.shell__nav {
  display: flex;
  gap: var(--sk-space-1);
  flex: 1;
  min-width: 0;
  overflow-x: auto;
}
.shell__actions {
  display: flex;
  align-items: center;
  gap: var(--sk-space-2);
  margin-left: auto;
}

/* --- 히어로: 감성 담당 --- */
.hero {
  padding: var(--sk-space-8) 0 var(--sk-space-6);
  color: var(--sk-text-invert);
}
.hero--dawn {
  background: var(--sk-hero-dawn);
}
.hero--day {
  background: var(--sk-hero-day);
}
.hero--dusk {
  background: var(--sk-hero-dusk);
}
.hero--night {
  background: var(--sk-hero-night);
}
.hero__eyebrow {
  margin: 0 0 var(--sk-space-2);
  font-size: var(--sk-text-xs);
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.85;
}
.hero__title {
  margin: 0;
  font-size: var(--sk-text-2xl);
  font-weight: 800;
  letter-spacing: -0.02em;
}
.hero__live {
  margin-top: var(--sk-space-5);
  padding-top: var(--sk-space-4);
  border-top: 1px solid rgba(255, 255, 255, 0.28);
}
/* '현재 위치'는 아래 줄이 무엇인지 알려주는 꼬리표라, 값보다 작게 위에 둔다. */
.hero__row {
  display: flex;
  align-items: baseline;
  gap: var(--sk-space-4);
  flex-wrap: wrap;
}
.hero__city {
  font-size: var(--sk-text-lg);
  font-weight: 600;
}
.hero__temp {
  font-size: var(--sk-text-2xl);
  font-weight: 700;
  letter-spacing: -0.02em;
}
/* 히어로 위에 얹히는 안내라 배경(하늘 그라데이션)과 대비를 유지해야 한다.
   본문 정보가 아니라 곁들이는 줄이므로 값보다 작게 둔다. */
.hero__ask {
  display: flex;
  align-items: center;
  gap: var(--sk-space-3);
  flex-wrap: wrap;
  margin: var(--sk-space-3) 0 0;
  font-size: var(--sk-text-sm);
}
.hero__ask-text {
  opacity: 0.92;
}
.hero__ask-btn {
  border: 1px solid rgba(255, 255, 255, 0.55);
  background-color: rgba(255, 255, 255, 0.16);
  color: var(--sk-text-invert);
  border-radius: var(--sk-radius-pill);
  padding: 5px 14px;
  font-size: var(--sk-text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: background-color var(--sk-transition);
}
.hero__ask-btn:hover {
  background-color: rgba(255, 255, 255, 0.28);
}

.hero__subtitle {
  margin: var(--sk-space-2) 0 0;
  font-size: var(--sk-text-base);
  opacity: 0.9;
  max-width: 60ch;
}

/* --- 본문: 정보 담당 --- */
.shell__main {
  flex: 1;
  padding-top: var(--sk-space-6);
  padding-bottom: var(--sk-space-8);
}

/* --- 푸터 --- */
.shell__foot {
  border-top: 1px solid var(--sk-border);
  background-color: var(--sk-surface);
}
.shell__foot-inner {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--sk-space-2);
  padding-top: var(--sk-space-4);
  padding-bottom: var(--sk-space-4);
  font-size: var(--sk-text-xs);
  color: var(--sk-text-muted);
}
.shell__foot-dim {
  opacity: 0.7;
}

@media (max-width: 640px) {
  /* 좁은 화면에서는 브랜드·내비·액션이 한 줄에 들어가지 않아 내비가 밖으로 밀려 잘렸다.
     내비를 아래 줄로 내려 폭을 다 쓰게 한다. */
  .shell__nav {
    order: 3;
    flex-basis: 100%;
    padding-bottom: var(--sk-space-2);
  }
  .shell__actions {
    margin-left: auto;
  }
  .shell__bar-inner {
    gap: var(--sk-space-3);
    padding-top: var(--sk-space-2);
  }

  .hero {
    padding: var(--sk-space-6) 0 var(--sk-space-5);
  }
  .hero__title {
    font-size: var(--sk-text-xl);
  }
}
</style>
