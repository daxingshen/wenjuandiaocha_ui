import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // 绑 0.0.0.0:监听所有网卡,局域网/容器内其它设备可访问(默认仅 localhost)。
    host: '0.0.0.0',
    port: 5174,
    // dev 联调:/api 同源代理到后端(取真实发布问卷)。后端默认 :8080。
    proxy: {
      '/api': {
        target: 'http://localhost:18080',
        changeOrigin: true,
      },
    },
  },
});
