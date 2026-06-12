/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WATCHTOWER_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
