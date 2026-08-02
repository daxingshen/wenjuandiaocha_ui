/**
 * 主题切换(明暗)。data-theme 挂在 <html>,所有颜色经 CSS 变量自动重绘(UI 文档 §6.2)。
 * 框架无关的极小工具;偏好存 localStorage。studio/runtime 顶栏各放一个开关调用它。
 */
export type Theme = 'light' | 'dark';

const KEY = 'xingjuan:theme';

/** 读当前主题(优先 localStorage,回落 light)。 */
export function getTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/** 应用主题到 <html> 并持久化。 */
export function applyTheme(t: Theme): void {
  document.documentElement.setAttribute('data-theme', t);
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* 忽略隐私模式写入失败 */
  }
}

/** 在明暗间切换,返回切换后的主题。 */
export function toggleTheme(): Theme {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

/** 启动时按存储的偏好初始化(在 render 前调用)。 */
export function initTheme(): void {
  applyTheme(getTheme());
}
