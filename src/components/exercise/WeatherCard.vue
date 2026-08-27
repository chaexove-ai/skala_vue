<script setup>
// 과제 3-4) 선택된 도시 객체를 props로 전달받아 표시하고,
// 카드 선택(select-card) / 상세보기(click-detail) 이벤트를 부모에게 올려보낸다.
import { computed, onMounted, onUnmounted } from 'vue'
import { statusMeta } from '@/data/weatherStatus.js'

const props = defineProps({
  city: {
    type: Object,
    required: true,
    // validator: 부모가 형태가 다른 객체를 넘기면 개발 중 콘솔 경고로 즉시 알 수 있다.
    // 컴포넌트를 나눈 뒤에는 "부모가 무엇을 넘겨야 하는가"가 곧 계약이므로 여기에 적어둔다.
    validator: (city) => ['id', 'name', 'temp', 'status'].every((key) => key in city),
  },
  selected: { type: Boolean, default: false },
  query: { type: String, default: '' },
  expanded: { type: Boolean, default: false },
  // 상세보기 버튼 문구. 기본값은 카드 안에서 펼치는 동작(▼/▲)을 뜻한다.
  // 과제 4처럼 버튼이 다른 페이지로 이동할 때는 부모가 문구를 바꿔서 동작을 알려준다.
  detailLabel: { type: String, default: '' },
  // 화면에 보일 기온과 단위 기호. 넘기지 않으면 원본(섭씨) 값을 그대로 쓴다.
  // 과제 5에서 단위 변환이 생겼지만, 이 값을 넘기지 않는 과제 3 화면은 예전 그대로 동작한다.
  displayTemp: { type: Number, default: null },
  unitSymbol: { type: String, default: '°' },
  // 과제 6) 검색으로 추가한 도시만 카드에서 뺄 수 있게 한다.
  // 넘기지 않으면 삭제 버튼이 아예 없으므로 과제 3 화면은 그대로다.
  removable: { type: Boolean, default: false },
  // 과제 7) 즐겨찾기. favoritable을 넘기지 않으면 별표가 아예 렌더링되지 않으므로
  // 이 카드를 쓰는 과제 3 화면은 예전 그대로다.
  favoritable: { type: Boolean, default: false },
  favorite: { type: Boolean, default: false },
  feelsLike: { type: Number, default: null },
})
defineEmits(['select-card', 'click-detail', 'remove-card', 'toggle-favorite'])

// 날씨 상태별 카드 색상/아이콘: 공통 테이블(weatherStatus.js)에서 찾아 쓴다.
const meta = computed(() => statusMeta(props.city.status))
const statusClass = computed(() => `weather-card--${meta.value.theme}`)

// 부모에게 받은 검색어(query)를 자식이 직접 가공: 도시 이름 중 일치한 글자만 <mark>로 강조한다.
// v-html 대신 조각 배열로 쪼개서 렌더링 (XSS 여지를 남기지 않기 위함)
// 라이프사이클: 이 화면은 v-for + 검색 필터라서 검색어를 치는 순간 걸러진 카드가 실제로 제거된다.
// 카드가 언제 생기고 사라지는지를 콘솔에서 눈으로 확인할 수 있는 자리라 훅을 여기에 건다.
onMounted(() => console.log(`🟢 [onMounted] ${props.city.name} 카드 생성`))
onUnmounted(() => console.log(`⚪️ [onUnmounted] ${props.city.name} 카드 제거`))

const nameParts = computed(() => {
  const { name } = props.city
  const hitAt = props.query ? name.indexOf(props.query) : -1
  if (hitAt === -1) return [{ text: name, hit: false }]
  return [
    { text: name.slice(0, hitAt), hit: false },
    { text: name.slice(hitAt, hitAt + props.query.length), hit: true },
    { text: name.slice(hitAt + props.query.length), hit: false },
  ].filter((part) => part.text)
})
</script>

<template>
  <div
    class="weather-card"
    :class="[statusClass, { 'weather-card--selected': selected, 'weather-card--matched': query }]"
    @click="$emit('select-card', city)"
  >
    <button
      v-if="favoritable"
      class="weather-card__star"
      :class="{ 'weather-card__star--on': favorite }"
      :title="favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'"
      @click.stop="$emit('toggle-favorite', city)"
    >
      {{ favorite ? '★' : '☆' }}
    </button>
    <button
      v-if="removable"
      class="weather-card__remove"
      title="목록에서 빼기"
      @click.stop="$emit('remove-card', city)"
    >
      ✕
    </button>
    <p class="weather-card__name">
      <span v-for="(part, i) in nameParts" :key="i" :class="{ 'is-hit': part.hit }">{{
        part.text
      }}</span>
    </p>
    <p class="weather-card__temp sk-num">{{ displayTemp ?? city.temp }}{{ unitSymbol }}</p>
    <p class="weather-card__status">{{ city.status }}{{ meta.icon }}</p>

    <!-- 선택하면 테두리만 바뀌어서 눌렸는지 알기 어려웠다. 글자로도 알려준다. -->
    <p v-if="selected" class="weather-card__picked">선택됨</p>

    <button class="detail-btn" @click.stop="$emit('click-detail', city)">
      {{ detailLabel || (expanded ? '상세보기 닫기 ▲' : '상세보기 ▼') }}
    </button>

    <!-- 범위 슬롯(scoped slot): 상세 영역의 "틀"은 카드가 갖고, 무엇을 보여줄지는 부모가 정한다.
         카드가 자기 데이터(city, feelsLike)를 슬롯 props로 올려보내므로 부모가 그것을 받아 쓸 수 있다.
         부모가 #detail을 안 넘기면 아래 기본 내용(fallback)이 그대로 렌더링된다. -->
    <div v-if="expanded" class="weather-card__detail">
      <slot name="detail" :city="city" :feels-like="feelsLike">
        체감 온도 <strong>{{ feelsLike }}°</strong>
      </slot>
    </div>
  </div>
</template>

<style scoped>
/* 과제 3-5) 카드 한 장에 해당하는 디자인만 여기에서 관리 */
.weather-card {
  position: relative;
  border-radius: 12px;
  padding: 16px 16px 16px 14px;
  min-width: 120px;
  text-align: center;
  cursor: pointer;
  box-shadow: var(--sk-shadow);
  border-left: 4px solid var(--sk-w-default);
  transition: transform 0.15s ease;
}
.weather-card:hover {
  transform: translateY(-3px);
}
.weather-card--matched {
  outline: 2px solid var(--sk-highlight);
  outline-offset: 2px;
}
.weather-card--selected {
  box-shadow:
    0 0 0 3px var(--sk-accent),
    var(--sk-shadow-lg);
}

.weather-card--sunny {
  background: linear-gradient(160deg, var(--sk-w-sunny-bg) 0%, var(--sk-surface) 60%);
  border-left-color: var(--sk-w-sunny);
}
.weather-card--rain {
  background: linear-gradient(160deg, var(--sk-w-rain-bg) 0%, var(--sk-surface) 60%);
  border-left-color: var(--sk-w-rain);
}
.weather-card--cloud {
  background: linear-gradient(160deg, var(--sk-w-cloud-bg) 0%, var(--sk-surface) 60%);
  border-left-color: var(--sk-w-cloud);
}
.weather-card--overcast {
  background: linear-gradient(160deg, var(--sk-w-overcast-bg) 0%, var(--sk-surface) 60%);
  border-left-color: var(--sk-w-overcast);
}
.weather-card--default {
  background: linear-gradient(160deg, var(--sk-w-default-bg) 0%, var(--sk-surface) 60%);
}
.weather-card__star {
  position: absolute;
  top: 2px;
  left: 2px;
  /* 아이콘만 키우는 게 아니라 누를 수 있는 면적을 함께 넓힌다.
     32px는 손가락으로도 빗나가지 않는 최소 크기다. */
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  border-radius: var(--sk-radius-sm);
  color: var(--sk-text-muted);
  font-size: var(--sk-text-lg);
  line-height: 1;
  cursor: pointer;
  transition: transform var(--sk-transition);
}
.weather-card__star:hover {
  background-color: var(--sk-surface-hover);
  transform: scale(1.15);
}
.weather-card__star--on {
  color: var(--sk-w-sunny);
}
.weather-card__remove {
  position: absolute;
  top: 6px;
  right: 6px;
  border: none;
  background: none;
  color: var(--sk-text-muted);
  font-size: var(--sk-text-xs);
  line-height: 1;
  padding: 4px 6px;
  border-radius: var(--sk-radius-sm);
  cursor: pointer;
}
.weather-card__remove:hover {
  background-color: var(--sk-danger-weak);
  color: var(--sk-danger);
}
.weather-card__name {
  font-weight: 700;
  color: var(--sk-text);
  margin: 0 0 4px;
}
.weather-card__name .is-hit {
  background-color: var(--sk-highlight-weak);
  border-radius: 3px;
  padding: 0 1px;
}
.weather-card__temp {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 4px;
  color: var(--sk-text);
}
.weather-card__status {
  font-size: 13px;
  color: var(--sk-text-muted);
  margin: 0;
}

.weather-card__picked {
  margin: var(--sk-space-2) 0 0;
  font-size: var(--sk-text-xs);
  font-weight: 700;
  color: var(--sk-accent);
}
.detail-btn {
  margin-top: 10px;
  width: 100%;
  border: 1px solid var(--sk-border);
  background-color: var(--sk-surface);
  border-radius: 8px;
  padding: 6px 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.detail-btn:hover {
  background-color: var(--sk-surface-hover);
}
.weather-card__detail {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--sk-border);
  font-size: 13px;
  color: var(--sk-text);
}
</style>
