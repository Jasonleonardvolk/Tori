/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ITORI_WS_URL?: string;
  readonly VITE_ITORI_API_URL?: string;
  readonly VITE_ITORI_API_PORT?: string;
  readonly VITE_ITORI_WS_PORT?: string;
  readonly VITE_ENABLE_CONCEPT_EXTRACTION?: string;
  readonly VITE_ENABLE_PHASE_VISUALIZATION?: string;
  readonly VITE_ENABLE_DEBUG_TOOLS?: string;
  readonly VITE_DEFAULT_APP?: string;
  // Add other environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
