// 날씨 상태 하나당 필요한 정보(아이콘 / 카드 테마 / 체감온도 보정)를 한 테이블에 모아둔다.
//
// feelsAdjust 는 과제 6에서 실제 API의 feels_like 값을 쓰게 되면서 최신 화면에서는 쓰지 않는다.
// 다만 과제 2·3(components/archive/)은 API 없이 체감온도를 직접 계산하는 것이 그날의 학습
// 내용이었으므로 그 화면들이 계속 참조한다. 지우면 과거 과제 결과물이 깨지므로 남겨둔다.
// 과제 1에서 쓰던 statusIcons 매핑 방식을 확장한 것으로, 과제 1·2·3이 같은 데이터 모델을 쓰게 하기 위함이다.
//
// 왜 status 문자열에 이모지를 같이 넣지 않는가:
//   status: '맑음☀️' 처럼 저장하면 분기를 status.includes('맑음') 같은 문자열 검색으로 해야 하고,
//   '맑음 가끔 비' 같은 값이 들어오면 두 조건에 동시에 걸려버린다.
//   데이터는 '맑음'이라는 값만 갖고, 보여줄 아이콘은 아래 표에서 찾아 쓰는 편이 안전하다.
export const WEATHER_STATUS = {
  맑음: { icon: '☀️', theme: 'sunny', feelsAdjust: 1 },
  비: { icon: '🌧️', theme: 'rain', feelsAdjust: -2 },
  구름: { icon: '⛅', theme: 'cloud', feelsAdjust: -1 },
  흐림: { icon: '🌫️', theme: 'overcast', feelsAdjust: -1 },
  눈: { icon: '❄️', theme: 'rain', feelsAdjust: -2 },
  소나기: { icon: '🌦️', theme: 'rain', feelsAdjust: -2 },
  뇌우: { icon: '⛈️', theme: 'rain', feelsAdjust: -2 },
  안개: { icon: '🌁', theme: 'overcast', feelsAdjust: -1 },
  황사: { icon: '😷', theme: 'overcast', feelsAdjust: 0 },
  강풍: { icon: '💨', theme: 'cloud', feelsAdjust: -2 },
  태풍: { icon: '🌀', theme: 'rain', feelsAdjust: -3 },
}

// 표에 없는 상태가 들어와도 화면이 깨지지 않도록 기본값을 돌려준다.
const FALLBACK = { icon: '🌡️', theme: 'default', feelsAdjust: 0 }

export const statusMeta = (status) => WEATHER_STATUS[status] ?? FALLBACK
export const statusIcon = (status) => statusMeta(status).icon

// 우산/겉옷처럼 "비 계열인가"를 묻는 곳이 여러 군데라 판단 기준도 여기에 모아둔다.
export const isWet = (status) => ['비', '눈', '소나기', '뇌우', '태풍'].includes(status)
