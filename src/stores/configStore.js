import { defineStore } from 'pinia'

// 과제 5) 날씨 단위(섭씨/화씨) 설정을 담는 스토어.
//
// 단위는 헤더의 토글 버튼에서 바꾸는데, 그 값을 써야 하는 곳은 메인 대시보드·상세 페이지·통계로
// 서로 멀리 떨어져 있다. props로 내려보내려면 중간 컴포넌트를 전부 거쳐야 하므로,
// 화면 어디서든 직접 꺼내 쓸 수 있는 스토어에 둔다.
export const useConfigStore = defineStore('config', {
  // state: 단위를 저장하는 변수 (초기값 섭씨)
  state: () => ({
    unit: 'celsius',
  }),

  getters: {
    // 현재 단위 상태에 맞는 기호
    unitSymbol: (state) => (state.unit === 'celsius' ? '℃' : '℉'),

    isFahrenheit: (state) => state.unit === 'fahrenheit',

    // [추가 getter] 원본 데이터는 항상 섭씨 숫자이고, 화면에 보일 때만 변환한다.
    // getter가 함수를 돌려주면 인자를 받아 계산할 수 있어서, 화면마다 변환식을 복붙하지 않아도 된다.
    displayTemp: (state) => (celsius) =>
      state.unit === 'fahrenheit' ? Math.round((celsius * 9) / 5 + 32) : celsius,

    // [추가 getter] 기온 "차이"는 변환식이 다르다.
    // 5℃ 차이는 9℉ 차이지 41℉ 차이가 아니므로, +32를 더하면 안 된다.
    displayDiff: (state) => (celsiusDiff) =>
      state.unit === 'fahrenheit' ? Math.round((celsiusDiff * 9) / 5) : celsiusDiff,
  },

  actions: {
    // 'celsius'와 'fahrenheit'를 토글(스위칭)하는 함수
    toggleUnit() {
      this.unit = this.unit === 'celsius' ? 'fahrenheit' : 'celsius'
    },
  },
})
