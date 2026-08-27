<script setup>
// 과제 4-6) 지난 실습 보관함
// 과제 4에서 화면이 라우트로 나뉘면서 과제 1~3과 기초 실습이 갈 곳을 잃기 때문에,
// /archive/:step 이라는 두 번째 동적 경로를 만들어 회차별로 보관한다.
// (라우트가 무거운 화면일수록 Lazy Loading의 효과가 크다. 이 화면은 기초 실습 30여 개를 품고 있어서
//  /archive 로 들어오기 전까지는 번들이 내려오지 않는다.)
import { computed } from 'vue'
import WeatherMockup from '@/components/archive/WeatherMockup.vue'
import WeatherComposition from '@/components/archive/WeatherComposition.vue'
import WeatherParent from '@/components/archive/WeatherParent.vue'
import BasicPractices from '@/components/practices/BasicPractices.vue'

const STEPS = {
  mockup: { label: '과제 1 · Weather Mockup', component: WeatherMockup },
  composition: { label: '과제 2 · Weather Composition', component: WeatherComposition },
  component: { label: '과제 3 · Weather Component', component: WeatherParent },
  basic: { label: '기초 실습 1~4일차', component: BasicPractices },
}

const props = defineProps({
  step: {
    type: String,
    required: true,
    // 주소에 없는 회차를 넣어도 화면이 깨지지 않도록, 유효한 키인지 먼저 검사한다.
    // defineProps는 setup() 바깥으로 끌어올려지기 때문에 위의 STEPS를 참조할 수 없어서
    // 키 목록을 여기에 직접 적는다. (컴파일러가 알려준 제약)
    validator: (step) => ['mockup', 'composition', 'component', 'basic'].includes(step),
  },
})

const stepKeys = Object.keys(STEPS)
const current = computed(() => STEPS[props.step] ?? null)
</script>

<template>
  <div>
    <nav class="steps">
      <RouterLink
        v-for="key in stepKeys"
        :key="key"
        :to="`/archive/${key}`"
        class="steps__link"
        active-class="steps__link--active"
      >
        {{ STEPS[key].label }}
      </RouterLink>
    </nav>

    <!-- 동적 컴포넌트: 어떤 회차를 보여줄지는 URL의 :step이 정한다. -->
    <component :is="current.component" v-if="current" />

    <p v-else class="unknown">
      <code>{{ step }}</code> 은(는) 없는 회차입니다. 위에서 회차를 선택해 주세요.
    </p>
  </div>
</template>

<style scoped>
.steps {
  display: flex;
  gap: var(--sk-space-2);
  flex-wrap: wrap;
  margin-bottom: var(--sk-space-5);
}
.steps__link {
  border: 1px solid var(--sk-border);
  border-radius: var(--sk-radius-pill);
  padding: var(--sk-space-2) var(--sk-space-4);
  font-size: var(--sk-text-sm);
  font-weight: 600;
  color: var(--sk-text-muted);
  background-color: var(--sk-surface);
  text-decoration: none;
}
.steps__link:hover {
  color: var(--sk-accent);
  border-color: var(--sk-accent);
}
.steps__link--active {
  background-color: var(--sk-accent);
  border-color: var(--sk-accent);
  color: var(--sk-text-invert);
}
.unknown {
  color: var(--sk-danger);
  background-color: var(--sk-danger-weak);
  border-radius: var(--sk-radius);
  padding: var(--sk-space-3) var(--sk-space-4);
  font-size: var(--sk-text-sm);
}
.unknown code {
  font-weight: 700;
}
</style>
