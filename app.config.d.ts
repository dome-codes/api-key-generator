declare module '*/app.config.js' {
  interface AppConfig {
    useMockAuth: boolean
    appBasePath: string
    apiBaseUrl: string
    keycloakUrl: string
    keycloakRealm: string
    keycloakClientId: string
    /** Scopes für Access-Token (z. B. "openid default admin"). Optional. */
    keycloakScope?: string
    showDebug: boolean
  }

  const config: AppConfig
  export default config
}

declare module '../../app.config.js' {
  interface AppConfig {
    useMockAuth: boolean
    appBasePath: string
    apiBaseUrl: string
    keycloakUrl: string
    keycloakRealm: string
    keycloakClientId: string
    keycloakScope?: string
    showDebug: boolean
  }

  const config: AppConfig
  export default config
}

declare module '@/app.config.js' {
  interface AppConfig {
    useMockAuth: boolean
    appBasePath: string
    apiBaseUrl: string
    keycloakUrl: string
    keycloakRealm: string
    keycloakClientId: string
    keycloakScope?: string
    showDebug: boolean
  }

  const config: AppConfig
  export default config
}

declare module '@root/app.config.js' {
  interface AppConfig {
    useMockAuth: boolean
    appBasePath: string
    apiBaseUrl: string
    keycloakUrl: string
    keycloakRealm: string
    keycloakClientId: string
    keycloakScope?: string
    showDebug: boolean
  }

  const config: AppConfig
  export default config
}

declare module 'app.config.js' {
  interface AppConfig {
    useMockAuth: boolean
    appBasePath: string
    apiBaseUrl: string
    keycloakUrl: string
    keycloakRealm: string
    keycloakClientId: string
    keycloakScope?: string
    showDebug: boolean
  }

  const config: AppConfig
  export default config
}
