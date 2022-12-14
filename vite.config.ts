import { fileURLToPath, URL } from 'url'
import { readFile } from 'fs/promises'
import type { UserConfigExport } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Layouts from 'vite-plugin-vue-layouts'
import Pages from 'vite-plugin-pages'
import WindiCSS from 'vite-plugin-windicss'

// https://vitejs.dev/config/
export default async (): Promise<UserConfigExport> => {
  const proxyUrl = await getEnvConfig('VITE_PROXY_URL')
  return {
    plugins: [
      vue(),
      vueJsx(),
      AutoImport({
        imports: ['vue', 'vue-router', '@vueuse/core'],
        eslintrc: {
          enabled: true,
          filepath: './.eslintrc-auto-import.json',
          globalsPropValue: true
        },
        dts: './auto-imports.d.ts'
      }),
      Components({
        dirs: ['src/components'],
        resolvers: [NaiveUiResolver()],
        dts: './components.d.ts'
      }),
      Layouts(),
      Pages({
        dirs: [{ dir: 'src/views', baseRoute: '' }],
        exclude: ['**/components/*.vue'],
        importMode: 'async'
      }),
      WindiCSS()
    ],
    base: './',
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      host: true,
      proxy: {
        '/api': {
          target: proxyUrl,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, '')
        }
      }
    },
    define: {
      // 关闭OPTIONS_API,减少打包大小
      __VUE_OPTIONS_API__: false
    },
    build: {
      // 消除打包大小超过 500kb 警告
      chunkSizeWarningLimit: 2000,
      minify: 'terser',
      // 移除 console.log、debugger 和 注释
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
          // pure_funcs: ['console.log']
        },
        output: {
          // 删除注释
          comments: false
        }
      }
    }
  }
}

async function getEnvConfig(name: string) {
  const env = process.env.NODE_ENV || 'development'
  const file = await readFile(`./.env.${env}`, 'utf8')
  const arr = file.split('\n').find(i => i.includes(name))
  return arr!.split('=')[1].trim()
}
