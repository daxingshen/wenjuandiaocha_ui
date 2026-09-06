/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 后端 API base,默认 '/api'(dev 由 vite 代理到 :8089)。 */
  readonly VITE_API_BASE?: string;
  /** 作答端(runtime)base,用于拼分享链接;默认回落当前 origin。dev 下可设 http://localhost:5174。 */
  readonly VITE_RUNTIME_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
