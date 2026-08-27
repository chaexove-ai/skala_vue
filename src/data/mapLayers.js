// 지도 위에 겹쳐 그릴 수 있는 OpenWeatherMap 타일 레이어.
//
// 레이어 선택 버튼은 지도 안이 아니라 카드 헤더에 두기로 해서, 목록을 여기로 뺐다.
// 버튼을 그리는 쪽(상세 페이지)과 타일을 그리는 쪽(WeatherMap)이 같은 목록을 봐야 하기 때문이다.
//
// 기본값이 기온인 이유: 강수는 비가 안 오는 날 아무것도 안 보여서 지도만 덩그러니 남는다.
// 기온 레이어는 언제나 색이 칠해져 있다.
export const MAP_LAYERS = [
  { key: 'temp_new', label: '기온' },
  { key: 'clouds_new', label: '구름' },
  { key: 'precipitation_new', label: '강수' },
]

export const DEFAULT_MAP_LAYER = 'temp_new'
