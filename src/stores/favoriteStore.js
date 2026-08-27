import { defineStore } from 'pinia'

// 과제 7) 즐겨찾기.
//
// 과제 1(Weather Mockup)에서 별표 토글을 만들었지만 그때는 화면 안에서만 살아 있는 값이었다.
// 이제 스토어와 localStorage가 있으니, 화면을 옮기거나 새로고침해도 남는 값으로 다시 만든다.
//
// 도시 객체가 아니라 id만 저장한다. 날씨는 매번 새로 받아오므로 객체를 통째로 넣어두면
// 옛날 기온이 남고, 즐겨찾기와 실제 목록이 어긋나게 된다.
const STORAGE_KEY = 'skala-vue:favorites'

const load = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

const save = (ids) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    console.warn('[favoriteStore] 즐겨찾기를 저장하지 못했습니다.')
  }
}

export const useFavoriteStore = defineStore('favorite', {
  state: () => ({
    ids: load(),
  }),

  getters: {
    count: (state) => state.ids.length,
    isFavorite: (state) => (cityId) => state.ids.includes(cityId),
    hasAny: (state) => state.ids.length > 0,
  },

  actions: {
    toggle(cityId) {
      const added = !this.ids.includes(cityId)
      this.ids = added ? [...this.ids, cityId] : this.ids.filter((id) => id !== cityId)
      save(this.ids)
      return added
    },

    // 목록에서 사라진 도시(검색으로 추가했다가 삭제한 경우)는 즐겨찾기에서도 빼준다.
    prune(existingIds) {
      const next = this.ids.filter((id) => existingIds.includes(id))
      if (next.length !== this.ids.length) {
        this.ids = next
        save(this.ids)
      }
    },
  },
})
