/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHOW_DEBUG?: string
  readonly VITE_BYPASS_KEYCLOAK?: string
  readonly VITE_ADMIN_GROUP_NAME?: string
  readonly VITE_USER_GROUP_NAME?: string
  readonly VITE_TECHNICAL_GROUP_NAME?: string
  readonly VITE_APP_VERSION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
