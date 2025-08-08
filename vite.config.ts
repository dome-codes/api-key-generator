import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  base: '/admin-console/',
  plugins: [vue(), vueDevTools()],
  server: {
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@root': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  define: {
    __SHOW_DEBUG__: JSON.stringify(process.env.VITE_SHOW_DEBUG !== 'false'),
  },
})
