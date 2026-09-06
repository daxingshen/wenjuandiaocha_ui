import { networkInterfaces } from 'node:os';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/** runtime(受访者作答端)dev 端口,对齐 apps/runtime/vite.config.ts。 */
const RUNTIME_DEV_PORT = 5174;

/** 探测本机第一个非内网回环的 IPv4(局域网 IP),找不到回落 localhost。 */
function lanHost(): string {
  for (const addrs of Object.values(networkInterfaces())) {
    for (const a of addrs ?? []) {
      if (a.family === 'IPv4' && !a.internal) return a.address;
    }
  }
  return 'localhost';
}

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  // 分享链接的 runtime base:显式 VITE_RUNTIME_BASE 优先(逃生口);dev 起服时否则用探测到的局域网
  // IP 拼 runtime 端口。IP 来自 Node 侧(起服的机器),故创建者用 localhost 还是 IP 打开 studio 都对——
  // 浏览器无从得知本机 LAN IP,必须服务端注入。见 src/features/publish/publishLink.ts。
  // 仅 dev serve 注入:prod build 不烤入构建机 IP,交回 resolveRuntimeBase() 运行时回落 location.origin。
  const env = loadEnv(mode, '.', '');
  const runtimeBase = env.VITE_RUNTIME_BASE || `http://${lanHost()}:${RUNTIME_DEV_PORT}`;
  const define =
    command === 'serve'
      ? { 'import.meta.env.VITE_RUNTIME_BASE': JSON.stringify(runtimeBase) }
      : undefined;

  return {
    plugins: [react()],
    define,
    server: {
      // 绑 0.0.0.0:监听所有网卡,局域网/容器内其它设备可访问(默认仅 localhost)。
      host: '0.0.0.0',
      port: 5173,
      // dev 联调:/api 同源代理到后端,免 CORS、cookie 同源可带。后端默认 :8080。
      proxy: {
        '/api': {
          target: 'http://localhost:18080',
          changeOrigin: true,
        },
      },
    },
  };
});
