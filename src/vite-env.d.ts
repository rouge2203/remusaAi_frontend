/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  readonly VITE_USE_MOCK?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_17VIN_USER?: string;
  readonly VITE_17VIN_PASSWORD?: string;
  readonly VITE_PLATE_USER?: string;
  readonly VITE_RAPIDAPI_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
