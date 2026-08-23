import { defineConfig } from 'vitest/config';

// welcome 消毒测试需要 DOM:DOMPurify 依赖 DOM。
// 用 jsdom(非 happy-dom):happy-dom 与 DOMPurify 的 CSS/style 过滤不兼容。
export default defineConfig({
  test: {
    environment: 'jsdom',
  },
});
