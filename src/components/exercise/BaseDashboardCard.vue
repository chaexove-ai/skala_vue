<script setup>
// 과제 3-2) 검색박스 / 리스트박스의 "테두리 + 제목 + 여백" 디자인을 공통화한 껍데기 컴포넌트.
// 안쪽 내용은 <slot>으로 비워두고, 부모(WeatherParent)가 도시 검색 / 날씨 현황을 주입한다.
defineProps({
  title: {
    type: String,
    default: '',
    // 제목 줄이 두 줄로 깨지지 않도록 길이를 제한한다.
    validator: (title) => title.length <= 40,
  },
})
</script>

<template>
  <section class="card-block">
    <!-- 이름 있는 슬롯(named slot): 제목 옆 배지 자리만 부모에게 열어준다.
         이 자리에 들어오는 내용은 부모 스코프에서 컴파일되므로, 부모의 상태(도시 개수/정렬 기준)를
         그대로 읽어서 표시할 수 있다. (과제 3-6 참고사항) -->
    <header v-if="title || $slots.badge || $slots.actions" class="card-block__header">
      <h3 v-if="title" class="card-block__title">{{ title }}</h3>
      <span v-if="$slots.badge" class="card-block__badge"><slot name="badge" /></span>
      <!-- 헤더 오른쪽 액션 자리. 그 카드의 내용을 조작하는 버튼(정렬 등)이 들어간다. -->
      <div v-if="$slots.actions" class="card-block__actions"><slot name="actions" /></div>
    </header>
    <slot />
  </section>
</template>

<style scoped>
/* 과제 3-5) 이 컴포넌트에 해당하는 디자인만 여기에서 관리 */
.card-block {
  border: 1px solid var(--sk-border);
  border-radius: 12px;
  padding: 16px 18px;
  margin-bottom: 16px;
  background-color: var(--sk-surface-alt);
}
.card-block__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}
.card-block__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.card-block__actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--sk-space-2);
}
.card-block__badge {
  font-size: 12px;
  font-weight: 700;
  color: var(--sk-accent);
  background-color: var(--sk-accent-weak);
  border-radius: 999px;
  padding: 3px 10px;
}
</style>
