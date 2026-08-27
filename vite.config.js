import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),

    // 과제 7) Element Plus 주문형(on-demand) 로딩.
    // 라이브러리를 통째로 등록하면(app.use(ElementPlus)) 쓰지도 않는 컴포넌트와 CSS까지 번들에 들어간다.
    // 아래 두 플러그인이 "실제로 쓴 것"만 골라서 import 구문과 스타일을 자동으로 넣어준다.
    //   - AutoImport  : ElMessage, ElMessageBox 같은 함수형 API와 그 CSS
    //   - Components  : <el-tag>, <el-skeleton> 같은 템플릿 컴포넌트와 그 CSS
    AutoImport({ resolvers: [ElementPlusResolver()] }),
    Components({ resolvers: [ElementPlusResolver()] }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
