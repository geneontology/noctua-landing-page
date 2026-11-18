/// <reference types="vite/client" />

type AppEnv = 'dev' | 'beta' | 'prod'

interface ImportMetaEnv {
  readonly VITE_APP_ENV: AppEnv
  readonly VITE_BASE_URL?: string
  /** Dev-only overrides; in production the Noctua shell injects `window.global_*` instead. */
  readonly VITE_BARISTA_URL?: string
  readonly VITE_GOLR_URL?: string
  readonly VITE_GOLR_NEO_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
