<script setup>
// 과제 4-1) Catch-all Route가 잡아낸 주소를 안내하는 화면.
// 어떤 주소로 들어왔는지 보여줘야 사용자가 오타를 확인할 수 있으므로 route.fullPath를 표시한다.
import { useRoute } from 'vue-router'
import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'

const route = useRoute()
</script>

<template>
  <BaseDashboardCard title="404 — 페이지를 찾을 수 없습니다">
    <template #badge>Catch-all Route</template>
    <p class="msg">
      요청하신 주소 <code>{{ route.fullPath }}</code> 에 해당하는 화면이 없습니다.
    </p>
    <p class="hint">주소를 잘못 입력했거나, 삭제된 페이지일 수 있습니다.</p>
    <div class="actions">
      <RouterLink to="/" class="btn btn--primary">메인 대시보드</RouterLink>
      <RouterLink to="/about" class="btn">서비스 소개</RouterLink>
    </div>
  </BaseDashboardCard>
</template>

<style scoped>
.msg {
  margin: 0 0 var(--sk-space-2);
  font-size: var(--sk-text-md);
}
.msg code {
  background-color: var(--sk-danger-weak);
  color: var(--sk-danger);
  border-radius: var(--sk-radius-sm);
  padding: 2px 6px;
}
.hint {
  margin: 0 0 var(--sk-space-5);
  font-size: var(--sk-text-sm);
  color: var(--sk-text-muted);
}
.actions {
  display: flex;
  gap: var(--sk-space-2);
  flex-wrap: wrap;
}
.btn {
  display: inline-block;
  border: 1px solid var(--sk-border);
  border-radius: var(--sk-radius);
  padding: var(--sk-space-2) var(--sk-space-4);
  font-size: var(--sk-text-sm);
  font-weight: 600;
  text-decoration: none;
  color: var(--sk-text);
  background-color: var(--sk-surface);
}
.btn:hover {
  background-color: var(--sk-surface-hover);
}
.btn--primary {
  background-color: var(--sk-accent);
  border-color: var(--sk-accent);
  color: var(--sk-text-invert);
}
.btn--primary:hover {
  background-color: var(--sk-accent-hover);
}
</style>
