import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from 'eslint-config-prettier/flat'

export default defineConfig([
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,js,mjs,jsx}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  {
    languageOptions: {
      globals: {
        ...globals.browser,
        // unplugin-auto-import가 빌드할 때 넣어주는 Element Plus 함수형 API.
        // 소스에는 import 구문이 없어서 ESLint 눈에는 선언된 적 없는 변수로 보이고
        // no-undef 에러가 난다. 빌드에는 실제로 들어오는 값이므로 전역으로 인정해준다.
        // (readonly: 우리가 값을 덮어쓰면 그건 오히려 실수이므로 그때는 에러를 낸다)
        ElMessage: 'readonly',
        ElMessageBox: 'readonly',
      },
    },
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  // 커스텀 규칙 — 배열은 뒤에 올수록 앞의 설정을 덮어쓰므로 skipFormatting 바로 앞에 둔다.
  {
    name: 'app/custom-rules',
    rules: {
      // == 는 타입이 다르면 몰래 변환해서 비교한다. ('20' == 20 이 true)
      // 날씨 앱은 API가 준 숫자와 화면에서 만든 문자열이 섞이는 곳이라 이 규칙이 실질적으로 필요하다.
      eqeqeq: ['error', 'always'],
      // 이 저장소는 실습 결과물이라 console.log가 "무엇이 언제 실행되는지" 보여주는 설명 장치로 쓰인다.
      // (watch/watchEffect, onMounted/onUnmounted 확인용) 그래서 경고 대상에서 뺀다.
      'no-console': 'off',
      // 안 쓰는 변수는 지우는 게 맞지만, 에러로 막으면 작업 중간에 저장을 못 한다. 경고까지만.
      'no-unused-vars': 'warn',
      // App.vue처럼 한 단어짜리 컴포넌트 이름을 허용한다.
      'vue/multi-word-component-names': 'off',
    },
  },

  skipFormatting,
])
