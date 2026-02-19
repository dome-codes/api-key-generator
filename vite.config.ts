import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// Lese Version aus version.yml
const versionYml = readFileSync(
  join(fileURLToPath(new URL('./', import.meta.url)), 'version.yml'),
  'utf-8',
)
const appVersion = versionYml.match(/APIKEY_MANAGEMENT:\s*(.+)/)?.[1]?.trim() || '1.0.0'

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
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
  },
})
