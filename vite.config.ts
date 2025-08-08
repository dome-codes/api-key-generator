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
    // Docker deployment support
    'process.env.VITE_APP_BASE_PATH': JSON.stringify(
      process.env.VITE_APP_BASE_PATH || '__VITE_APP_BASE_PATH__',
    ),
    'process.env.VITE_API_BASE_URL': JSON.stringify(
      process.env.VITE_API_BASE_URL || '__VITE_API_BASE_URL__',
    ),
    'process.env.VITE_KEYCLOAK_URL': JSON.stringify(
      process.env.VITE_KEYCLOAK_URL || '__VITE_KEYCLOAK_URL__',
    ),
    'process.env.VITE_KEYCLOAK_REALM': JSON.stringify(
      process.env.VITE_KEYCLOAK_REALM || '__VITE_KEYCLOAK_REALM__',
    ),
    'process.env.VITE_KEYCLOAK_CLIENT_ID': JSON.stringify(
      process.env.VITE_KEYCLOAK_CLIENT_ID || '__VITE_KEYCLOAK_CLIENT_ID__',
    ),
  },
})
