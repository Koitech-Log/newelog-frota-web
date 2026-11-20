/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_RANKING_SERVICE_URL?: string;
  readonly VITE_RANKING_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
