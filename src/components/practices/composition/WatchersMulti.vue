<script setup>
import { ref, watch } from 'vue'

const lastName = ref('홍')
const firstName = ref('길동')
const logMessage = ref('아직 감시 시스템이 작동하지 않았습니다.')

// Multi-Source Watch: 배열 안에 여러 개의 감시 대상을 함께 묶어두면,
// 그중 하나만 바뀌어도 watch 콜백 하나가 한 번에 반응합니다.
// 콜백의 newValues/oldValues도 각 소스와 같은 순서의 배열로 전달됩니다.
watch([lastName, firstName], ([newLast, newFirst], [oldLast, oldFirst]) => {
  logMessage.value = `📍 이름 변경 감지! [${oldLast}${oldFirst}] ➡️ [${newLast}${newFirst}]`
})
</script>

<template>
  <div class="practice-section">
    <h2>watch() 여러 소스 동시 감시 (Multi-Source Watch)</h2>
    <h3>🙋 이름 변경 제어판</h3>
    <p>현재 이름: {{ lastName }}{{ firstName }}</p>
    <button @click="lastName = '김'">성만 '김'으로 변경</button> &nbsp;
    <button @click="firstName = '철수'">이름만 '철수'로 변경</button>

    <div class="monitor">
      <h3>👁️‍🗨️ 배열로 묶은 감시자 모니터링</h3>
      <p>{{ logMessage }}</p>
      <small style="color: gray"
        >성, 이름 둘 중 하나만 바뀌어도 watch([lastName, firstName], ...) 하나가 반응합니다.</small
      >
    </div>
  </div>
</template>

<style scoped>
.monitor {
  border-color: #0984e3;
  background: #e3fafc;
}
</style>
