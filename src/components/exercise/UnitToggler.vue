<script setup>
// 과제 5-1) 날씨 단위를 바꾸는 UI. 헤더에 배치되어 어느 화면에서든 접근할 수 있다.
// 이 컴포넌트는 props를 받지 않는다. 단위는 부모가 아니라 스토어가 갖고 있고,
// 필요한 화면이 각자 스토어에서 직접 꺼내 쓰기 때문이다.
import { useConfigStore } from '@/stores/configStore.js'

const config = useConfigStore()
</script>

<template>
  <div class="unit">
    <span class="unit__label">날씨 단위</span>
    <strong class="unit__value" aria-live="polite">
      {{ config.isFahrenheit ? '화씨' : '섭씨' }}({{ config.unitSymbol }})
    </strong>
    <button
      class="unit__btn"
      :title="`${config.isFahrenheit ? '섭씨' : '화씨'}로 바꾸기`"
      @click="config.toggleUnit"
    >
      단위 변경
    </button>
  </div>
</template>

<style scoped>
.unit {
  display: flex;
  align-items: center;
  gap: var(--sk-space-2);
  font-size: var(--sk-text-xs);
  white-space: nowrap;
}
.unit__label {
  color: var(--sk-text-muted);
  font-weight: 600;
}
.unit__value {
  font-size: var(--sk-text-sm);
  font-weight: 800;
  color: var(--sk-text);
}
.unit__btn {
  border: 1px solid var(--sk-border);
  background-color: var(--sk-surface);
  border-radius: var(--sk-radius-pill);
  padding: var(--sk-space-1) var(--sk-space-3);
  font-size: var(--sk-text-xs);
  font-weight: 700;
  color: var(--sk-accent);
  cursor: pointer;
}
.unit__btn:hover {
  background-color: var(--sk-accent-weak);
}
</style>
