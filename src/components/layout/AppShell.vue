<script setup>
// 앱 전체의 뼈대: 헤더(브랜드 + 내비 + 액션) / 히어로 / 본문 / 푸터
// 화면마다 이 구조를 반복해서 짜지 않도록 껍데기만 여기서 책임지고, 내용은 slot으로 받는다.
//
// slot 구성
//   #nav     : 화면 전환 메뉴 (지금은 탭 버튼, 과제 4에서 <RouterLink>로 교체 예정)
//   #actions : 헤더 우측 액션 영역 (과제 5의 ℃/℉ 단위 토글이 들어갈 자리)
//   기본     : 본문
import { computed, ref, onMounted, onUnmounted } from 'vue'

defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
})

// 히어로 윗줄에는 지금 시각을 표시한다. 날씨 화면에서 "언제 기준 정보인가"는
// 실제로 필요한 정보라서, 분이 바뀔 때마다 갱신한다.
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

// 시간대에 따라 히어로 배경만 바꾼다. (배경색으로 충분히 전달되므로 문구로 또 설명하지 않는다)
const timeOfDay = computed(() => {
  const hour = now.value.getHours()
  if (hour < 6) return 'night'
  if (hour < 9) return 'dawn'
  if (hour < 17) return 'day'
  if (hour < 20) return 'dusk'
  return 'night'
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
      </div>
    </section>

    <main class="shell__inner shell__main">
      <slot />
    </main>

    <footer class="shell__foot">
      <div class="shell__inner shell__foot-inner">
        <span>SKALA Vue.js 실습 과제 — 판교_5반_임채환</span>
        <span class="shell__foot-dim">Vue 3 · Vue Router · Vite</span>
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
  .hero {
    padding: var(--sk-space-6) 0 var(--sk-space-5);
  }
  .hero__title {
    font-size: var(--sk-text-xl);
  }
}
</style>
