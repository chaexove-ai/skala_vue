<script setup>
// 과제 4-5) 서비스 소개용 정적 페이지 + 메인 대시보드로 돌아가기
import { computed } from 'vue'
import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'

// 구현 포인트: 화면에서 눈으로 확인되지 않는 내부 동작을 정리해둔다.
const features = [
  '`components/exercise/` 폴더의 독립 부품 컴포넌트(BaseDashboardCard · SearchBar · WeatherCard · StatusBar)를 조합해 화면을 구성',
  '부모가 상태를 소유하고 자식은 props로 받아 표시, 사건은 emits로 올려보내는 단방향 데이터 흐름',
  '클라이언트 사이드 라우팅으로 새로고침 없는 화면 전환',
  '동적 경로 매칭(`/weather/:cityId`)으로 도시별 상세 페이지 진입, Mount 시점에 해당 도시 데이터 조회',
  '라우트 지연 로딩(Lazy Loading)으로 첫 화면 번들 분리 — 기초 실습이 든 보관함 화면은 진입 시에만 내려받음',
  '정의되지 않은 주소는 Catch-all Route가 받아 404 화면으로 처리',
  '전역 네비게이션 가드에서 라우트 meta 기반으로 브라우저 탭 제목 갱신',
  '한글 입력은 v-model 대신 `:value` + `@input`으로 처리해 조합 중인 글자도 즉시 검색에 반영',
]

// 백틱으로 감싼 부분만 <code>로 렌더링한다.
// v-html을 쓰면 간단하지만 XSS 여지를 남기므로, 문자열을 조각으로 쪼개서 그린다.
// (기초 실습 VueHtmlXss에서 배운 내용)
const featureParts = computed(() =>
  features.map((text) => text.split('`').map((chunk, i) => ({ text: chunk, code: i % 2 === 1 }))),
)

const stack = [
  {
    name: 'Vue 3 (Composition API)',
    desc: 'ref / computed / watch / watchEffect / 라이프사이클 훅',
  },
  {
    name: 'Vue Router 4',
    desc: '지연 로딩, 동적 경로 매칭, Catch-all Route, 전역 네비게이션 가드',
  },
  { name: 'Vite', desc: '개발 서버와 프로덕션 빌드' },
  { name: 'ESLint · Prettier', desc: '코드 품질과 포맷 통일' },
]

const routeGuide = [
  { path: '/', desc: '메인 날씨 대시보드 — 검색 · 정렬 · 카드 선택' },
  { path: '/weather/:cityId', desc: '지역별 상세 기상관측 정보 (동적 경로)' },
  { path: '/stats', desc: '기온 분포와 날씨 상태 구성 통계' },
  { path: '/archive/:step', desc: '과제 1~3과 기초 실습 보관함' },
  { path: '그 외 모든 주소', desc: '404 안내 화면 (Catch-all Route)' },
]
</script>

<template>
  <div>
    <BaseDashboardCard title="무엇을 만들었나">
      <template #badge>SKALA Vue.js 실습</template>
      <p class="para">
        본 앱은 <strong>Vue 3 + Vue Router 4</strong> 기반으로 제작한 실습용 기상 관측
        대시보드입니다. 전국 11개 도시의 날씨를 카드로 훑어보고, 도시를 선택하면
        습도·풍속·강수확률·미세먼지 등 상세 관측 정보를 확인할 수 있습니다.
      </p>
      <ul class="points">
        <li v-for="(parts, i) in featureParts" :key="i" class="points__item">
          <template v-for="(part, j) in parts" :key="j">
            <code v-if="part.code">{{ part.text }}</code
            ><span v-else>{{ part.text }}</span>
          </template>
        </li>
      </ul>
    </BaseDashboardCard>

    <BaseDashboardCard title="사용 기술">
      <template #badge>{{ stack.length }}가지</template>
      <dl class="rows">
        <div v-for="item in stack" :key="item.name" class="rows__row">
          <dt class="rows__key">{{ item.name }}</dt>
          <dd class="rows__val">{{ item.desc }}</dd>
        </div>
      </dl>
    </BaseDashboardCard>

    <BaseDashboardCard title="화면 구성">
      <template #badge>{{ routeGuide.length }}개 경로</template>
      <dl class="rows">
        <div v-for="item in routeGuide" :key="item.path" class="rows__row">
          <dt class="rows__key">
            <code>{{ item.path }}</code>
          </dt>
          <dd class="rows__val">{{ item.desc }}</dd>
        </div>
      </dl>
    </BaseDashboardCard>

    <RouterLink to="/" class="home-btn">← 메인 대시보드로 돌아가기</RouterLink>
  </div>
</template>

<style scoped>
.para {
  margin: 0 0 var(--sk-space-3);
  font-size: var(--sk-text-base);
  line-height: 1.7;
  max-width: 70ch;
}
.para:last-child {
  margin-bottom: 0;
}
.points {
  margin: var(--sk-space-4) 0 0;
  padding-left: var(--sk-space-5);
  display: flex;
  flex-direction: column;
  gap: var(--sk-space-2);
}
.points__item {
  font-size: var(--sk-text-base);
  line-height: 1.7;
}
.points__item code {
  background-color: var(--sk-highlight-weak);
  border-radius: var(--sk-radius-sm);
  padding: 1px 6px;
  font-size: var(--sk-text-sm);
}

.rows {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sk-space-2);
}
.rows__row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sk-space-2) var(--sk-space-4);
  padding-bottom: var(--sk-space-2);
  border-bottom: 1px solid var(--sk-border);
}
.rows__row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.rows__key {
  margin: 0;
  width: 200px;
  flex-shrink: 0;
  font-weight: 700;
  font-size: var(--sk-text-sm);
}
.rows__key code {
  background-color: var(--sk-surface-hover);
  border-radius: var(--sk-radius-sm);
  padding: 2px 6px;
  font-weight: 600;
}
.rows__val {
  margin: 0;
  font-size: var(--sk-text-sm);
  color: var(--sk-text-muted);
}
.home-btn {
  display: inline-block;
  background-color: var(--sk-accent);
  color: var(--sk-text-invert);
  border-radius: var(--sk-radius);
  padding: var(--sk-space-2) var(--sk-space-4);
  font-size: var(--sk-text-sm);
  font-weight: 600;
  text-decoration: none;
}
.home-btn:hover {
  background-color: var(--sk-accent-hover);
}
</style>
