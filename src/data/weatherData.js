// 과제 6) Mock Data를 걷어내고, 이제 이 파일은 "어느 도시를 볼 것인가"만 갖는다.
// 기온·습도 같은 실제 값은 OpenWeatherMap에서 받아오므로 여기에 두지 않는다.
//
// 배열 순서 = 화면에 표시되는 기본 순서.
// 기상 예보에서 지역을 읽는 순서(수도권 → 충청 → 호남 → 영남 → 제주)를 따랐다.
export const CITIES = [
  { id: 'city_01', name: '서울', lat: 37.5665, lon: 126.978 },
  { id: 'city_02', name: '인천', lat: 37.4563, lon: 126.7052 },
  { id: 'city_03', name: '수원', lat: 37.2636, lon: 127.0286 },
  { id: 'city_04', name: '대전', lat: 36.3504, lon: 127.3845 },
  { id: 'city_05', name: '세종', lat: 36.48, lon: 127.289 },
  { id: 'city_06', name: '광주', lat: 35.1595, lon: 126.8526 },
  { id: 'city_07', name: '전주', lat: 35.8242, lon: 127.148 },
  { id: 'city_08', name: '부산', lat: 35.1796, lon: 129.0756 },
  { id: 'city_09', name: '대구', lat: 35.8714, lon: 128.6014 },
  { id: 'city_10', name: '울산', lat: 35.5384, lon: 129.3114 },
  { id: 'city_11', name: '제주', lat: 33.4996, lon: 126.5312 },
]

export const findCityById = (cityId) => CITIES.find((city) => city.id === cityId) ?? null

// 미세먼지 농도(㎍/㎥)를 등급으로 바꾼다. (환경부 기준을 단순화)
export const fineDustGrade = (value) => {
  if (value <= 15) return { label: '좋음', tone: 'good' }
  if (value <= 35) return { label: '보통', tone: 'normal' }
  if (value <= 75) return { label: '나쁨', tone: 'bad' }
  return { label: '매우 나쁨', tone: 'worst' }
}
