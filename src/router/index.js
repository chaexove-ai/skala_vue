import { createRouter, createWebHistory } from 'vue-router'
import WeatherHomeView from '../views/WeatherHomeView.vue'

// 과제 4-1) 라우트 규칙 정의
// - 첫 화면(WeatherHomeView)만 정적 import: 어차피 진입 즉시 필요하므로 미리 받아둔다.
// - 나머지는 () => import(...) 형태의 Lazy Loading: 해당 주소로 이동하는 순간에만 내려받는다.
//   덕분에 기초 실습 30여 개가 들어있는 ArchiveView는 그 화면에 들어가기 전까지 로드되지 않는다.
const routes = [
  {
    path: '/',
    name: 'home',
    component: WeatherHomeView,
    meta: {
      title: '지역별 날씨 대시보드',
      subtitle: '도시를 검색하고, 카드를 눌러 상세 관측 정보를 확인하세요.',
    },
  },
  {
    // 동적 경로 매칭: /weather/city_01 → props로 cityId='city_01'이 상세 페이지에 전달된다.
    // props: true 를 주면 자식이 useRoute() 없이 순수한 props만으로 동작해서 테스트하기도 쉽다.
    path: '/weather/:cityId',
    name: 'city-detail',
    component: () => import('../views/WeatherDetailView.vue'),
    props: true,
    meta: {
      title: '상세 기상관측 정보',
      subtitle: '선택한 도시의 습도·풍속·강수확률·미세먼지를 확인합니다.',
    },
  },
  {
    // [비교 실험] 같은 상세 화면을 쿼리스트링으로도 열어본다: /weather?cityId=city_01
    // props를 함수로 주면 라우터가 query를 prop으로 바꿔서 넘겨주므로,
    // WeatherDetailView는 자기가 경로로 받았는지 쿼리로 받았는지 알 필요가 없다.
    path: '/weather',
    name: 'city-detail-query',
    component: () => import('../views/WeatherDetailView.vue'),
    props: (route) => ({ cityId: route.query.cityId ?? '' }),
    meta: { title: '상세 기상관측 정보', subtitle: '쿼리스트링(?cityId=)으로 도시를 지정한 화면입니다.' },
  },
  {
    path: '/stats',
    name: 'stats',
    component: () => import('../views/WeatherStatsView.vue'),
    meta: {
      title: '기온 통계',
      subtitle: '11개 도시의 기온 분포와 날씨 상태 구성을 한눈에 봅니다.',
    },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/WeatherAboutView.vue'),
    meta: {
      title: '서비스 소개',
      subtitle: '이 화면이 무엇으로 만들어졌는지 정리했습니다.',
    },
  },
  {
    // 과제 1~3 결과물과 기초 실습을 보존하는 화면. :step으로 어느 회차를 볼지 고른다.
    path: '/archive/:step',
    name: 'archive',
    component: () => import('../views/ArchiveView.vue'),
    props: true,
    meta: {
      title: '지난 실습 보관함',
      subtitle: '과제 1~3과 1~3일차 기초 실습 결과물을 그대로 보관합니다.',
    },
  },
  // /archive 로만 들어오면 첫 회차로 보낸다.
  { path: '/archive', redirect: '/archive/mockup' },
  {
    // 과제 4-1) Catch-all Route: 위 규칙에 하나도 걸리지 않은 주소를 전부 받아낸다.
    // 정규식 (.*)* 를 쓰므로 /없는/주소/여러단계 도 함께 잡힌다.
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: { title: '페이지를 찾을 수 없습니다', subtitle: '주소를 다시 확인해 주세요.' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // 페이지를 옮기면 이전 화면의 스크롤 위치가 남아 있어서 본문 중간부터 보이는 문제를 막는다.
  // 뒤로가기(savedPosition)일 때는 사용자가 보던 위치를 복원한다.
  scrollBehavior: (to, from, savedPosition) => savedPosition ?? { top: 0 },
})

// 전역 네비게이션 가드: 모든 화면 전환 직전에 실행된다.
// 여기서는 브라우저 탭 제목을 라우트 meta에 맞춰 바꾸고, 이동 경로를 콘솔로 남긴다.
router.beforeEach((to, from) => {
  document.title = to.meta.title
    ? `${to.meta.title} · 판교_5반_임채환`
    : '판교_5반_임채환 Weather Dashboard'
  console.log(`🧭 [beforeEach] ${from.fullPath} → ${to.fullPath}`)
})

export default router
