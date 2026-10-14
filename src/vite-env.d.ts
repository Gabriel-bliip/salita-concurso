/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Base URL of the future Salita API, e.g. 'https://api.salita.cl'. See .env.example.
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
