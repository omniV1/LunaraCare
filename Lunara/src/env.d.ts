/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Global constant injected by Vite (see vite.config.ts)
declare const __VITE_API_BASE_URL__: string | undefined;
