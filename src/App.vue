<script setup>
// 과제 4-2) App.vue는 이제 화면을 직접 그리지 않는다.
// 내비게이션 바(<RouterLink>)와 메인 콘텐츠 영역(<RouterView />)만 배치하고,
// 실제 화면은 router/index.js가 주소에 맞춰 갈아 끼운다.
import { useRoute } from 'vue-router'
import AppShell from './components/layout/AppShell.vue'
import UnitToggler from './components/exercise/UnitToggler.vue'

const route = useRoute()

// 내비게이션 항목. 라우트를 추가하면 여기 한 줄만 늘리면 된다.
const navLinks = [
  { to: '/', label: '대시보드', exact: true },
  { to: '/stats', label: '기온 통계' },
  { to: '/archive/mockup', label: '지난 실습' },
  { to: '/about', label: '소개' },
]
</script>

<template>
  <!-- 히어로 제목은 각 라우트의 meta에서 가져온다. 화면마다 셸을 다시 짤 필요가 없다. -->
  <AppShell :title="route.meta.title ?? ''" :subtitle="route.meta.subtitle ?? ''">
    <template #nav>
      <!-- RouterLink는 현재 주소와 맞으면 자동으로 활성 클래스를 붙여준다.
           '/'는 모든 경로의 앞부분과 겹치므로 exact-active-class를 따로 지정한다. -->
      <RouterLink
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        class="nav__link"
        :active-class="link.exact ? '' : 'nav__link--active'"
        exact-active-class="nav__link--active"
      >
        {{ link.label }}
      </RouterLink>
    </template>

    <!-- 과제 5-2) 내비게이션 바 옆(헤더 우측)에 단위 토글 배치 -->
    <template #actions>
      <UnitToggler />
    </template>

    <RouterView />
  </AppShell>
</template>

<style scoped>
.nav__link {
  border: 1px solid transparent;
  border-radius: var(--sk-radius-pill);
  padding: var(--sk-space-2) var(--sk-space-4);
  font-size: var(--sk-text-sm);
  font-weight: 600;
  color: var(--sk-text-muted);
  white-space: nowrap;
  text-decoration: none;
  transition:
    color var(--sk-transition),
    background-color var(--sk-transition);
}
.nav__link:hover {
  color: var(--sk-accent);
  background-color: var(--sk-accent-weak);
}
.nav__link--active {
  color: var(--sk-text-invert);
  background-color: var(--sk-accent);
}
</style>
