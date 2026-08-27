import axios from 'axios'

// 과제 6) OpenWeatherMap 호출을 한 곳에 모아둔다.
// 화면(view)은 axios를 직접 부르지 않고 이 파일의 함수만 쓴다.
// 주소·키·공통 파라미터가 흩어지지 않아서, 나중에 API를 바꾸더라도 여기만 고치면 된다.

const API_KEY = import.meta.env.VITE_OPENWEATHER_KEY

// 서버 주소도 소스에 박아두지 않고 빌드 모드(.env.staging / .env.production)에서 받는다.
// 검증용 서버와 상용 서버가 갈리면 코드를 고치는 게 아니라 빌드 명령만 바꾸면 된다.
// 다만 개발 중에는 .env 에 이 값이 없을 수 있으므로, 없으면 기존 주소를 그대로 쓴다.
const BASE_URL = import.meta.env.VITE_API_URL || 'https://api.openweathermap.org'

// axios 인스턴스: 매 호출마다 반복되는 baseURL과 공통 파라미터를 미리 박아둔다.
const owm = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
  params: { appid: API_KEY, units: 'metric', lang: 'kr' },
})

// OpenWeatherMap의 날씨 분류(weather[0].main)를 우리가 쓰던 한글 상태로 옮긴다.
// 이렇게 해두면 weatherStatus.js의 아이콘·카드 색·체감온도 보정을 그대로 쓸 수 있다.
const STATUS_BY_MAIN = {
  Clear: '맑음',
  Clouds: '구름',
  Rain: '비',
  Drizzle: '비',
  Snow: '눈',
  Thunderstorm: '뇌우',
  Mist: '안개',
  Fog: '안개',
  Haze: '안개',
  Smoke: '안개',
  Dust: '황사',
  Sand: '황사',
  Squall: '강풍',
  Tornado: '태풍',
}

// 'Clouds'는 구름 양에 따라 느낌이 다르므로 상세 설명(id)으로 한 번 더 나눈다.
// 803(broken clouds) / 804(overcast clouds)는 흐림에 가깝다.
const toStatus = (weather) => {
  if (weather.id === 803 || weather.id === 804) return '흐림'
  return STATUS_BY_MAIN[weather.main] ?? '맑음'
}

// 응답 JSON에서 화면이 쓰는 값만 골라 우리 형태로 바꾼다.
// 화면이 OpenWeatherMap의 응답 구조를 직접 알지 않도록 하는 것이 목적이다.
const toCityWeather = (city, data) => ({
  ...city,
  temp: Math.round(data.main.temp),
  status: toStatus(data.weather[0]),
  description: data.weather[0].description,
  observation: {
    humidity: data.main.humidity,
    windSpeed: data.wind?.speed ?? 0,
    feelsLike: Math.round(data.main.feels_like),
    tempMin: Math.round(data.main.temp_min),
    tempMax: Math.round(data.main.temp_max),
    observedAt: data.dt,
    // 일출·일몰: 이미 응답에 들어 있어서 따로 부를 필요가 없다.
    // 히어로 배경을 "임의의 시간대"가 아니라 실제 해 뜨고 지는 시각 기준으로 바꾸는 데 쓴다.
    sunrise: data.sys.sunrise,
    sunset: data.sys.sunset,
  },
})

// 도시 한 곳의 현재 날씨
export const fetchCityWeather = async (city) => {
  const { data } = await owm.get('/data/2.5/weather', {
    params: { lat: city.lat, lon: city.lon },
  })
  return toCityWeather(city, data)
}

// 좌표만 알 때 (브라우저가 알려준 현재 위치 등)
export const fetchWeatherByCoords = (lat, lon, name = '현재 위치') =>
  fetchCityWeather({ id: 'my-location', name, lat, lon })

// 여러 도시를 한 번에. 순서대로 기다리면 도시 수만큼 시간이 걸리므로 Promise.all로 동시에 보낸다.
// allSettled를 쓰면 한 도시가 실패해도 나머지는 살릴 수 있지만,
// 실습에서는 실패를 분명히 보이게 하려고 all을 써서 한 곳이라도 실패하면 에러로 처리한다.
export const fetchAllCityWeather = (cities) => Promise.all(cities.map(fetchCityWeather))

// 대기오염 (미세먼지). units/lang 파라미터는 이 엔드포인트에서 의미가 없지만 있어도 무시된다.
export const fetchAirPollution = async (lat, lon) => {
  const { data } = await owm.get('/data/2.5/air_pollution', { params: { lat, lon } })
  const now = data.list[0]
  return { aqi: now.main.aqi, pm10: now.components.pm10, pm25: now.components.pm2_5 }
}

// 5일 / 3시간 예보. 40건이 오므로 화면에서 필요한 만큼만 잘라 쓴다.
export const fetchForecast = async (lat, lon) => {
  const { data } = await owm.get('/data/2.5/forecast', { params: { lat, lon } })
  return data.list.map((item) => ({
    time: item.dt_txt,
    temp: Math.round(item.main.temp),
    status: toStatus(item.weather[0]),
    pop: Math.round((item.pop ?? 0) * 100), // 강수확률: 0~1 → %
  }))
}
