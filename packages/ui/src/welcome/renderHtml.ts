/**
 * 欢迎页 HTML → 安全 HTML(渲染前必消毒)。内容为富文本编辑器产出的 HTML 串,这里判空 + 消毒。
 */
import { sanitizeWelcomeHtml } from './sanitize.js';

/** 富文本 HTML 是否为空(去标签后无可见文本;Quill 空文档为 '<p><br></p>')。供编辑器判空清字段复用。 */
export function isWelcomeHtmlEmpty(html: string | undefined): boolean {
  if (!html) return true;
  const stripped = html.replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, '').trim();
  return stripped.length === 0;
}

/** 富文本 HTML → 消毒后的安全 HTML。空内容返回空串。 */
export function welcomeHtmlToSafe(html: string | undefined): string {
  if (isWelcomeHtmlEmpty(html)) return '';
  return sanitizeWelcomeHtml(html as string);
}
