<script setup>
// 과제 4-1) Catch-all Route가 잡아낸 주소를 안내하는 화면.
// 어떤 주소로 들어왔는지 보여줘야 사용자가 오타를 확인할 수 있으므로 route.fullPath를 표시한다.
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'

const route = useRoute()

// 한글 주소는 %EC%97%86... 형태로 인코딩되어 들어온다. 사람이 읽을 수 있게 되돌린다.
const decodedPath = computed(() => {
  try {
    return decodeURI(route.fullPath)
  } catch {
    return route.fullPath
  }
})
</script>

<template>
  <BaseDashboardCard>
    <template #badge>Catch-all Route</template>
    <!-- 404는 대부분의 UI 라이브러리가 전용 컴포넌트를 갖고 있다.
         아이콘·여백·문구 배치를 직접 맞추는 것보다 el-result에 내용만 넘기는 편이 낫다. -->
    <el-result
      icon="warning"
      title="404 — 페이지를 찾을 수 없습니다"
      :sub-title="`요청하신 주소 ${decodedPath} 에 해당하는 화면이 없습니다.`"
    >
      <template #extra>
        <div class="actions">
          <RouterLink to="/"><el-button type="primary">메인 대시보드</el-button></RouterLink>
          <RouterLink to="/about"><el-button>서비스 소개</el-button></RouterLink>
        </div>
      </template>
    </el-result>
  </BaseDashboardCard>
</template>

<style scoped>
.actions {
  display: flex;
  gap: var(--sk-space-2);
  flex-wrap: wrap;
  justify-content: center;
}
</style>
