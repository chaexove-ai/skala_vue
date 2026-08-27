<script setup>
// 과제 6) 지도 + 날씨 레이어
//
// 지도 타일: OpenStreetMap (무료, 키 불필요)
// 날씨 레이어: OpenWeatherMap 타일 서버 — 같은 API 키로 강수·구름·기온 레이어를 겹쳐 그린다.
//
// Leaflet은 실제 DOM을 직접 다루는 라이브러리라 Vue의 반응형 밖에 있다.
// 그래서 지도 인스턴스는 ref로 잡아두고, onMounted에서 만들고 onUnmounted에서 반드시 치운다.
// (3일차 라이프사이클 실습에서 배운 "내가 만든 건 내가 치운다"가 그대로 적용되는 자리)
import { ref, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { DEFAULT_MAP_LAYER } from '@/data/mapLayers.js'

const props = defineProps({
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  name: { type: String, default: '' },
  // 어떤 레이어를 겹칠지는 카드 헤더의 버튼이 정한다. 이 컴포넌트는 그리기만 한다.
  layer: { type: String, default: DEFAULT_MAP_LAYER },
})

const API_KEY = import.meta.env.VITE_OPENWEATHER_KEY

const mapEl = ref(null)
let map = null
let weatherTile = null

const drawWeatherLayer = () => {
  if (!map) return
  if (weatherTile) map.removeLayer(weatherTile)
  weatherTile = L.tileLayer(
    `https://tile.openweathermap.org/map/${props.layer}/{z}/{x}/{y}.png?appid=${API_KEY}`,
    // 날씨 타일은 반투명이라 옅게 두면 바탕 지도에 묻힌다.
    { opacity: 0.85 },
  ).addTo(map)
}

onMounted(() => {
  // 줌 5로 시작한다. OpenWeatherMap의 날씨 타일은 넓은 지역을 한눈에 보는 용도라,
  // 줌을 당길수록 타일에 담긴 데이터가 급격히 줄어든다.
  // (서울 기준 강수 타일 용량: 줌 4에서 66KB → 줌 9에서 334B = 사실상 빈 이미지)
  // 그래서 지도를 당겨서 보는 화면이 아니라 "한반도 전체의 날씨 분포"를 보는 화면으로 잡았다.
  map = L.map(mapEl.value, {
    zoomControl: true,
    scrollWheelZoom: false,
    minZoom: 3,
    maxZoom: 8, // 이 이상 당기면 날씨 레이어가 비어 보인다
  }).setView([props.lat, props.lon], 5)

  // 바탕 지도
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(map)

  drawWeatherLayer()

  // 도시 위치 표시. 기본 마커 아이콘은 이미지 경로 문제가 있어서 원형 마커를 쓴다.
  L.circleMarker([props.lat, props.lon], {
    radius: 8,
    color: '#0284c7',
    fillColor: '#38bdf8',
    fillOpacity: 0.9,
    weight: 3,
  })
    .addTo(map)
    .bindTooltip(props.name, { permanent: true, direction: 'top', offset: [0, -8] })
})

// 레이어가 바뀌면 겹친 타일만 갈아 끼운다. (지도는 다시 만들지 않는다)
watch(() => props.layer, drawWeatherLayer)

onUnmounted(() => {
  // 지도를 정리하지 않으면 컴포넌트가 사라져도 DOM과 이벤트 리스너가 남는다.
  map?.remove()
  map = null
})
</script>

<template>
  <div>
    <div ref="mapEl" class="map" />
    <p class="map__hint">넓은 지역일수록 잘 보입니다. 지도를 끌어서 움직일 수 있습니다.</p>
  </div>
</template>

<style scoped>
.map__hint {
  margin: var(--sk-space-3) 0 0;
  font-size: var(--sk-text-xs);
  color: var(--sk-text-muted);
}
.map {
  height: 320px;
  border-radius: var(--sk-radius);
  border: 1px solid var(--sk-border);
  overflow: hidden;
  z-index: 0; /* 헤더(z-index:10) 위로 올라오지 않게 */
}
</style>
