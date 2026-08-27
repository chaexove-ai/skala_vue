// 과제 4) 화면이 여러 개로 나뉘면서 대시보드(Home)와 상세 페이지(Detail)가 같은 도시 데이터를 봐야 한다.
// 각 view가 자기 배열을 따로 들고 있으면 두 화면의 값이 어긋나므로, Mock Data를 여기 한 곳에 둔다.
// 과제 6에서 실제 날씨 API를 붙일 때도 이 파일의 반환값만 API 응답으로 바꾸면 된다.
//
// observation: 상세 페이지에서만 쓰는 "상세 기상관측 정보" (목록에는 표시하지 않는다)

// 배열 순서 = 화면에 표시되는 기본 순서.
// 기상 예보에서 지역을 읽는 순서(수도권 → 충청 → 호남 → 영남 → 제주)를 따랐다.
// 지리적으로 이어져 있어서 목록을 훑을 때 눈이 따라가기 쉽다.
export const CITY_WEATHER = [
  {
    id: 'city_01',
    name: '서울',
    temp: 28,
    status: '맑음',
    observation: {
      humidity: 55,
      windSpeed: 2.3,
      rainChance: 10,
      fineDust: 32,
      tempMin: 22,
      tempMax: 29,
    },
  },
  {
    id: 'city_02',
    name: '인천',
    temp: 25,
    status: '흐림',
    observation: {
      humidity: 75,
      windSpeed: 5.0,
      rainChance: 40,
      fineDust: 36,
      tempMin: 21,
      tempMax: 26,
    },
  },
  {
    id: 'city_03',
    name: '수원',
    temp: 24,
    status: '비',
    observation: {
      humidity: 88,
      windSpeed: 3.1,
      rainChance: 80,
      fineDust: 18,
      tempMin: 21,
      tempMax: 25,
    },
  },
  {
    id: 'city_04',
    name: '대전',
    temp: 24,
    status: '비',
    observation: {
      humidity: 90,
      windSpeed: 2.7,
      rainChance: 90,
      fineDust: 12,
      tempMin: 21,
      tempMax: 25,
    },
  },
  {
    id: 'city_05',
    name: '세종',
    temp: 23,
    status: '흐림',
    observation: {
      humidity: 66,
      windSpeed: 2.2,
      rainChance: 30,
      fineDust: 51,
      tempMin: 20,
      tempMax: 25,
    },
  },
  {
    id: 'city_06',
    name: '광주',
    temp: 27,
    status: '맑음',
    observation: {
      humidity: 58,
      windSpeed: 2.0,
      rainChance: 10,
      fineDust: 44,
      tempMin: 22,
      tempMax: 28,
    },
  },
  {
    id: 'city_07',
    name: '전주',
    temp: 22,
    status: '흐림',
    observation: {
      humidity: 68,
      windSpeed: 1.8,
      rainChance: 40,
      fineDust: 55,
      tempMin: 19,
      tempMax: 24,
    },
  },
  {
    id: 'city_08',
    name: '부산',
    temp: 26,
    status: '구름',
    observation: {
      humidity: 72,
      windSpeed: 4.6,
      rainChance: 30,
      fineDust: 41,
      tempMin: 23,
      tempMax: 27,
    },
  },
  {
    id: 'city_09',
    name: '대구',
    temp: 31,
    status: '맑음',
    observation: {
      humidity: 48,
      windSpeed: 1.5,
      rainChance: 0,
      fineDust: 78,
      tempMin: 24,
      tempMax: 33,
    },
  },
  {
    id: 'city_10',
    name: '울산',
    temp: 26,
    status: '구름',
    observation: {
      humidity: 70,
      windSpeed: 3.8,
      rainChance: 20,
      fineDust: 39,
      tempMin: 22,
      tempMax: 27,
    },
  },
  {
    id: 'city_11',
    name: '제주',
    temp: 22,
    status: '맑음',
    observation: {
      humidity: 64,
      windSpeed: 6.2,
      rainChance: 10,
      fineDust: 15,
      tempMin: 20,
      tempMax: 24,
    },
  },
]

// 관측 시각: Mock이므로 화면마다 값이 달라지지 않도록 고정 문자열로 둔다.
export const OBSERVED_AT = '2026-08-26 14:00 기준 (Mock Data)'

// 상세 페이지는 URL의 :cityId만 알고 있으므로, 여기서 도시 객체를 찾아 돌려준다.
// 없는 id면 null → 상세 페이지가 "찾을 수 없음" 화면을 보여준다.
export const findCityById = (cityId) => CITY_WEATHER.find((city) => city.id === cityId) ?? null

// 미세먼지 농도(㎍/㎥)를 등급으로 바꾼다. (환경부 기준을 단순화)
export const fineDustGrade = (value) => {
  if (value <= 15) return { label: '좋음', tone: 'good' }
  if (value <= 35) return { label: '보통', tone: 'normal' }
  if (value <= 75) return { label: '나쁨', tone: 'bad' }
  return { label: '매우 나쁨', tone: 'worst' }
}
