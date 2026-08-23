/**
 * 欢迎页富内容只读渲染组件。studio 预览 hero 与 runtime 作答欢迎屏共用。
 * html(Quill 产出)→ 消毒 → dangerouslySetInnerHTML。内容已过 sanitizeWelcomeHtml,DOM 无脚本/事件面。
 * 无内容(空 html)返回 null:由调用方决定「无欢迎内容仍显欢迎页、仅省内容区」。
 */
import { useMemo } from 'react';
import type { WelcomeContent } from '@xingjuan/engine';
import { welcomeHtmlToSafe } from './renderHtml.js';

export function WelcomeView({ welcome }: { welcome?: WelcomeContent }) {
  const html = useMemo(() => welcomeHtmlToSafe(welcome?.html), [welcome]);
  if (!html) return null;
  return (
    <div
      className="wel-body ql-editor"
      role="region"
      aria-label="欢迎语"
      // 内容已 sanitizeWelcomeHtml 消毒(白名单标签/属性 + style/class 过滤),此处渲染安全 HTML。
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
