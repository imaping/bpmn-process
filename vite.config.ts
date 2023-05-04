import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import * as path from 'path'
import { viteCommonjs } from '@originjs/vite-plugin-commonjs'

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? './bpmn-process' : '/bpmn-process',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/'),
      'vue-i18n': 'vue-i18n/dist/vue-i18n.cjs.js',
      types: path.resolve(__dirname, 'types/')
    }
  },
  server: {
    port: 8011,
    host: true
  },
  plugins: [
    vue(),
    viteCommonjs(),
    vueJsx({}),
    createSvgIconsPlugin({
      // 指定需要缓存的图标文件夹
      iconDirs: [path.resolve(process.cwd(), 'src/bpmn-icons')],
      // 指定symbolId格式
      symbolId: '[name]',
      customDomId: '__svg__icons__dom__'
    })
  ]
})
