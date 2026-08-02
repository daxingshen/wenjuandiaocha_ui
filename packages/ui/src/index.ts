/**
 * @xingjuan/ui — 设计系统。
 * token 以 CSS 变量承载(见 tokens.css),明暗双套,源自 prototype.html 与 UI 文档 §2。
 * 通用 React 组件(btn/badge/stat-tile 等)后续在此补充。
 */
export const UI_VERSION = '0.0.0';

export { getTheme, applyTheme, toggleTheme, initTheme, type Theme } from './theme.js';
