import { defineStore } from 'pinia'

// 과제 5-4) 본인만의 추가 스토어: 대시보드의 화면 상태(정렬 기준, 선택한 도시)를 담는다.
//
// 이 값들은 원래 WeatherHomeView가 갖고 있었는데, 그러면 상세 페이지에 갔다 돌아올 때마다
// 컴포넌트가 새로 만들어져서 정렬과 선택이 초기화된다. 스토어로 옮기면 화면을 옮겨 다녀도 유지된다.
// 덕분에 헤더(AppShell)에서도 "지금 어떤 도시를 보고 있는지"를 알 수 있다.
export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    sortOrder: 'none', // 'none' | 'asc' | 'desc'
    selectedCityId: null,
  }),

  getters: {
    sortLabel: (state) =>
      ({ none: '기본 순서', asc: '오름차순 ▲', desc: '내림차순 ▼' })[state.sortOrder],

    hasSelection: (state) => state.selectedCityId !== null,
  },

  actions: {
    toggleSortOrder() {
      this.sortOrder =
        this.sortOrder === 'none' ? 'asc' : this.sortOrder === 'asc' ? 'desc' : 'none'
    },

    selectCity(cityId) {
      this.selectedCityId = cityId
    },

    clearSelection() {
      this.selectedCityId = null
    },
  },
})
