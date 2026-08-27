<script setup>
import { statusIcon } from '@/data/weatherStatus.js'

// 과제 3-7) 추가 분리 컴포넌트: 선택된 도시 상태바 + 기온 정렬 토글
// 선택 도시 객체를 props로 받아 표시하고, 정렬 버튼은 toggle-sort 이벤트만 부모에게 올린다.
defineProps({
  selectedCityInfo: { type: Object, default: null },
  sortOrder: {
    type: String,
    required: true,
    // 정렬 상태는 이 셋 중 하나여야 한다. 오타('ASC')가 넘어오면 조용히 기본 순서로
    // 보이는 대신 콘솔 경고가 뜬다.
    validator: (order) => ['none', 'asc', 'desc'].includes(order),
  },
})
defineEmits(['toggle-sort'])

const sortLabel = { asc: '오름차순 ▲', desc: '내림차순 ▼', none: '기본 순서' }
</script>

<template>
  <div>
    <p class="status-bar">
      <span v-if="selectedCityInfo">
        <strong>{{ selectedCityInfo.name }}</strong
        >의 현재 날씨는 {{ selectedCityInfo.status }}{{ statusIcon(selectedCityInfo.status) }},
        {{ selectedCityInfo.temp }}°입니다.
      </span>
      <span v-else class="status-bar__placeholder">
        📍 도시 카드를 클릭하면 여기에 선택된 도시의 상세 정보가 표시됩니다.
      </span>
    </p>
    <button class="sort-btn" @click="$emit('toggle-sort')">
      🌡️ 기온순 정렬: {{ sortLabel[sortOrder] }}
    </button>
  </div>
</template>

<style scoped>
/* 과제 3-5) 상태바 전용 스타일 */
.status-bar {
  margin: 0 0 14px;
  font-size: 20px;
  font-weight: 400;
  color: var(--sk-text);
  line-height: 1.5;
}
.status-bar strong {
  font-weight: 700;
}
.status-bar__placeholder {
  font-size: 14px;
  font-weight: 400;
  color: var(--sk-text-muted);
}
.sort-btn {
  border: 1px solid var(--sk-border);
  background-color: var(--sk-surface);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.sort-btn:hover {
  background-color: var(--sk-surface-hover);
}
</style>
