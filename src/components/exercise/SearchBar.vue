<script setup>
// 과제 3-3) 부모로부터 검색어(반응형 데이터)를 props로 전달받아 표시하고,
// 입력이 생기면 update-query 이벤트로 검색어를 부모에게 되돌려준다. (단방향 데이터 흐름)
defineProps({
  searchQuery: { type: String, required: true },
})
const emit = defineEmits(['update-query'])

// v-model 대신 :value + @input 을 쓰는 이유:
// v-model 은 한글 조합(IME) 중에는 값을 갱신하지 않아서 "서" -> "서울" 이 조합이 끝난 뒤에야 반영된다.
// @input 으로 직접 받으면 조합 중인 글자도 그대로 부모에 전달되어 즉시 필터링된다.
const handleInput = (e) => {
  emit('update-query', e.target.value)
}
</script>

<template>
  <div>
    <!-- placeholder는 입력을 시작하면 사라지므로 라벨을 대신할 수 없다.
         화면에는 안 보이지만 스크린리더가 읽을 수 있도록 aria-label을 단다. -->
    <input
      :value="searchQuery"
      type="text"
      class="search-input"
      placeholder="검색할 도시 이름 입력"
      aria-label="도시 이름으로 목록 검색"
      @input="handleInput"
    />
    <!-- 검색어가 없을 때는 "전체"라는 당연한 말이 한 줄을 차지한다. 입력 중일 때만 보여준다. -->
    <p v-if="searchQuery.trim()" class="search-echo">검색 중인 도시: {{ searchQuery.trim() }}</p>
  </div>
</template>

<style scoped>
/* 과제 3-5) 검색바 전용 스타일 */
.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--sk-border-strong);
  border-radius: 8px;
  font-size: 16px;
  box-sizing: border-box;
}
.search-input:focus {
  outline: none;
  border-color: var(--sk-accent);
  box-shadow: 0 0 0 3px var(--sk-accent-ring);
}
.search-echo {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--sk-text-muted);
}
</style>
