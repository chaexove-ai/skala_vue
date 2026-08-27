import axios from 'axios'

// 과제 6-3) OpenWeatherMap 이외의 외부 API.
// OpenStreetMap의 Nominatim 지오코딩으로 "도시 이름 → 좌표"를 찾는다.
// 키가 필요 없고, 좌표만 알아내면 그다음 날씨는 OpenWeatherMap이 처리한다.
//
// 이용 정책상 초당 1회 이상 호출하지 않도록 되어 있어서,
// 타이핑할 때마다 부르지 않고 버튼을 눌렀을 때만 호출한다.
const nominatim = axios.create({
  baseURL: 'https://nominatim.openstreetmap.org',
  timeout: 8000,
  params: { format: 'json', limit: 8, 'accept-language': 'ko' },
})

// 도시·행정구역만 남긴다.
// Nominatim은 "속초"로 검색하면 아파트(landuse)나 식당(amenity)을 먼저 돌려주기 때문에,
// 날씨를 볼 지역으로 쓸 수 있는 종류만 걸러낸다.
const PLACE_CLASSES = ['place', 'boundary']

const toPlace = (place) => ({
  name: place.display_name.split(',')[0].trim(),
  fullName: place.display_name,
  lat: Number(place.lat),
  lon: Number(place.lon),
})

const request = async (query, koreaOnly) => {
  const params = { q: query }
  // 한글로 검색하면 국내 지명을 찾는 의도로 보고 대한민국으로 범위를 좁힌다.
  // 이렇게 하지 않으면 "구리"에 러시아의 동명 지역이 먼저 잡힌다.
  if (koreaOnly) params.countrycodes = 'kr'
  const { data } = await nominatim.get('/search', { params })
  return data.filter((place) => PLACE_CLASSES.includes(place.class)).map(toPlace)
}

// 한글 지명은 행정 접미사가 없으면 도시가 잘 안 잡힌다. ("속초" ✗ / "속초시" ○)
const KOREAN = /[가-힣]/
const HAS_SUFFIX = /(시|군|구|도|읍|면)$/

export const searchPlaces = async (query) => {
  const trimmed = query.trim()
  const isKorean = KOREAN.test(trimmed)

  const found = await request(trimmed, isKorean)
  if (found.length > 0) return found

  // 결과가 없을 때만 접미사를 붙여 한 번 더 찾아본다. (Nominatim 정책상 연속 호출은 피한다)
  if (isKorean && !HAS_SUFFIX.test(trimmed)) {
    return request(`${trimmed}시`, true)
  }
  return []
}

// 좌표 → 지명. 브라우저가 알려준 현재 위치가 어느 동네인지 이름을 붙이는 데 쓴다.
export const reverseGeocode = async (lat, lon) => {
  const { data } = await nominatim.get('/reverse', { params: { lat, lon, zoom: 10 } })
  const a = data.address ?? {}
  // 시/군/구 → 시·도 순으로 가장 구체적인 이름을 고른다.
  return a.city ?? a.county ?? a.town ?? a.village ?? a.state ?? '현재 위치'
}
