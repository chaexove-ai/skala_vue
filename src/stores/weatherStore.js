import { defineStore } from 'pinia'
import { CITIES } from '@/data/weatherData.js'
import { fetchAllCityWeather, fetchCityWeather, fetchWeatherByCoords } from '@/api/weatherApi.js'
import { reverseGeocode } from '@/api/geocodingApi.js'

// 과제 6) 서버에서 받아온 날씨를 담아두는 스토어.
//
// 왜 스토어인가: 대시보드·상세·통계가 같은 데이터를 보는데, 화면마다 각자 호출하면
// 화면을 옮길 때마다 API를 다시 부르게 된다. 한 번 받아서 스토어에 두면 이동은 공짜다.
// 사용자가 추가한 도시는 새로고침해도 남아 있어야 한다.
// "이 도시를 보고 싶다"는 사용자의 선택이라, 이번 방문에만 쓰고 버릴 값이 아니기 때문이다.
// (반대로 정렬 기준이나 선택한 도시는 이번 화면에서만 의미가 있어서 저장하지 않는다)
const STORAGE_KEY = 'skala-vue:extra-cities'

// 추가할 수 있는 도시 수를 제한한다.
// 화면을 열 때마다 기본 도시 + 추가 도시를 Promise.all로 한꺼번에 호출하는데,
// OpenWeatherMap 무료 요금제가 분당 60회라서 도시가 늘수록 한 번의 새로고침으로 한도를 넘길 수 있다.
// 10곳이면 총 21회라 한도의 3분의 1 수준이라 여유가 있다.
export const MAX_EXTRA_CITIES = 10

const loadExtraCities = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []
  } catch {
    // 저장된 값이 깨졌거나 브라우저가 localStorage를 막아둔 경우에도 앱은 그대로 동작해야 한다.
    return []
  }
}

const saveExtraCities = (cities) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cities))
  } catch {
    console.warn('[weatherStore] 추가한 도시를 저장하지 못했습니다.')
  }
}

export const useWeatherStore = defineStore('weather', {
  state: () => ({
    entries: [], // 도시 정보 + 서버에서 받은 날씨
    extraCities: loadExtraCities(), // 사용자가 검색해서 추가한 도시 (과제 6-3)
    isLoading: false,
    error: '',
    loadedAt: null,

    // 과제 6) 접속한 사람의 현재 위치 날씨. 히어로 배경과 요약을 이 값 기준으로 그린다.
    // 위치 권한은 거절될 수 있으므로, 실패해도 화면이 멀쩡하도록 상태를 따로 둔다.
    myLocation: null,
    locationStatus: 'idle', // idle | asking | granted | denied | unsupported
  }),

  getters: {
    // 화면은 이 목록만 보면 된다.
    list: (state) => state.entries,
    hasData: (state) => state.entries.length > 0,
    extraCount: (state) => state.extraCities.length,
    canAddMore: (state) => state.extraCities.length < MAX_EXTRA_CITIES,
    findById: (state) => (cityId) => state.entries.find((city) => city.id === cityId) ?? null,
  },

  actions: {
    // 전체 도시를 한 번에 불러온다. 이미 받아둔 게 있으면 다시 부르지 않는다.
    async loadAll({ force = false } = {}) {
      if (this.isLoading) return
      if (this.hasData && !force) return

      this.isLoading = true
      this.error = ''
      try {
        const targets = [...CITIES, ...this.extraCities]
        this.entries = await fetchAllCityWeather(targets)
        this.loadedAt = new Date()
        console.log(`🌤️ [weatherStore] ${this.entries.length}개 도시 날씨 수신`)
      } catch (error) {
        // 키가 없거나(401) 네트워크가 끊긴 경우 여기로 온다.
        this.error =
          error.response?.status === 401
            ? 'API 키가 올바르지 않거나 아직 활성화되지 않았습니다. (.env 확인)'
            : '날씨 데이터를 가져오지 못했습니다. 네트워크 상태를 확인해 주세요.'
        console.error('[weatherStore] 로드 실패:', error.message)
      } finally {
        this.isLoading = false
      }
    },

    // 과제 6-3) 검색으로 찾은 도시를 목록에 추가한다.
    // 좌표는 지오코딩(Nominatim)이 알려주고, 날씨는 OpenWeatherMap이 채운다.
    async addCity(place) {
      if (this.extraCities.length >= MAX_EXTRA_CITIES) {
        return {
          added: false,
          reason: `추가 도시는 최대 ${MAX_EXTRA_CITIES}곳까지입니다. 카드의 삭제 버튼으로 하나 지운 뒤 다시 시도해 주세요.`,
        }
      }

      const id = `extra_${place.lat.toFixed(3)}_${place.lon.toFixed(3)}`
      if (this.entries.some((entry) => entry.id === id)) {
        return { added: false, reason: '이미 목록에 있는 도시입니다.' }
      }
      const city = { id, name: place.name, lat: place.lat, lon: place.lon, isExtra: true }
      const fetched = await fetchCityWeather(city)
      this.extraCities.push(city)
      this.entries.push(fetched)
      saveExtraCities(this.extraCities)
      return { added: true, city: fetched }
    },

    // 추가했던 도시를 목록에서 뺀다.
    removeCity(cityId) {
      this.extraCities = this.extraCities.filter((city) => city.id !== cityId)
      this.entries = this.entries.filter((entry) => entry.id !== cityId)
      saveExtraCities(this.extraCities)
    },

    // 브라우저의 Geolocation API로 현재 위치를 물어보고, 그 지점의 날씨를 받아온다.
    // 지명은 Nominatim 역지오코딩으로 붙인다. (좌표만 있으면 "위도 37.4"라고 쓸 수는 없으니)
    async detectMyLocation() {
      if (!navigator.geolocation) {
        this.locationStatus = 'unsupported'
        return
      }
      this.locationStatus = 'asking'
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 8000,
            maximumAge: 10 * 60 * 1000, // 10분 안에 잡아둔 위치가 있으면 그걸 쓴다
          })
        })
        const { latitude, longitude } = position.coords
        const name = await reverseGeocode(latitude, longitude).catch(() => '현재 위치')
        this.myLocation = await fetchWeatherByCoords(latitude, longitude, name)
        this.locationStatus = 'granted'
        console.log(`📍 [weatherStore] 현재 위치: ${name} (${this.myLocation.temp}°)`)
      } catch {
        // 권한 거절 / 시간 초과 / 위치 확인 실패 — 어느 쪽이든 조용히 기본 동작으로 돌아간다.
        this.locationStatus = 'denied'
      }
    },

    // 상세 페이지에 주소로 바로 들어온 경우처럼, 한 도시만 필요할 때 쓴다.
    async loadCity(city) {
      const fetched = await fetchCityWeather(city)
      const index = this.entries.findIndex((entry) => entry.id === city.id)
      if (index === -1) this.entries.push(fetched)
      else this.entries[index] = fetched
      return fetched
    },
  },
})
