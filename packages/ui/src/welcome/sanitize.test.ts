/**
 * 安全核心:sanitizeWelcomeHtml(消毒 Quill 产出的 HTML)。
 * - 仅留白名单排版标签(p/strong/em/ul/li/h1-3/blockquote 等),剔除 script/img/a/iframe。
 * - style 只留 color / background-color / font-family / font-size,逐值正则校验;
 *   拒 url() / expression() / javascript: / CSS 注释 / 引号断逃 等注入向量。
 * - class 仅放行 Quill 的 ql-* 钩子。合法色/字体/字号保留。
 * - 脚本/事件处理器/危险协议一律剔除,渲染后 DOM 无脚本执行面。
 */
import { describe, it, expect } from 'vitest';
import { sanitizeWelcomeHtml } from './sanitize.js';

describe('sanitizeWelcomeHtml —— XSS 防线', () => {
  // ---- 脚本 / 事件 / 危险标签 ----
  it('剔除 <script>', () => {
    expect(sanitizeWelcomeHtml('<p>hi</p><script>alert(1)</script>')).not.toMatch(/script/i);
  });
  it('剔除 onerror/onclick 等事件处理器', () => {
    const out = sanitizeWelcomeHtml('<img src=x onerror="alert(1)"><p onclick="evil()">x</p>');
    expect(out).not.toMatch(/onerror/i);
    expect(out).not.toMatch(/onclick/i);
  });
  it('剔除 <img>(未启用图片)', () => {
    expect(sanitizeWelcomeHtml('<img src="x">')).not.toMatch(/<img/i);
  });
  it('剔除 <a href="javascript:">(未启用链接)', () => {
    const out = sanitizeWelcomeHtml('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toMatch(/javascript:/i);
    expect(out).not.toMatch(/<a\b/i);
  });
  it('剔除 <iframe>', () => {
    expect(sanitizeWelcomeHtml('<iframe src="evil"></iframe>')).not.toMatch(/iframe/i);
  });

  // ---- style 属性级白名单 ----
  it('保留合法 color(具名/hex/rgb/hsl)', () => {
    expect(sanitizeWelcomeHtml('<span style="color: red">x</span>')).toMatch(/color/);
    expect(sanitizeWelcomeHtml('<span style="color:#ff0000">x</span>')).toMatch(/#ff0000/);
    expect(sanitizeWelcomeHtml('<span style="color: rgb(1,2,3)">x</span>')).toMatch(/rgb/);
    expect(sanitizeWelcomeHtml('<span style="color: hsl(1, 2%, 3%)">x</span>')).toMatch(/hsl/);
  });
  it('保留合法 font-family 与 font-size', () => {
    const out = sanitizeWelcomeHtml('<span style="font-family: Arial; font-size: 18px">x</span>');
    expect(out).toMatch(/font-family/);
    expect(out).toMatch(/18px/);
  });
  it('剔除 style 里的 url()(背景注入向量)', () => {
    const out = sanitizeWelcomeHtml('<span style="background: url(javascript:alert(1))">x</span>');
    expect(out).not.toMatch(/url\(/i);
    expect(out).not.toMatch(/javascript/i);
  });
  it('剔除 style 里的 expression()', () => {
    const out = sanitizeWelcomeHtml('<span style="width: expression(alert(1))">x</span>');
    expect(out).not.toMatch(/expression/i);
  });
  it('剔除非白名单 style 属性(如 position/background)', () => {
    const out = sanitizeWelcomeHtml('<span style="position: fixed; background: red; color: blue">x</span>');
    expect(out).not.toMatch(/position/i);
    expect(out).not.toMatch(/background/i);
    expect(out).toMatch(/color/); // 白名单内的 color 保留
  });
  it('剔除 color 里夹带的 javascript: / 引号断逃 / 注释', () => {
    expect(sanitizeWelcomeHtml('<span style="color: javascript:alert(1)">x</span>')).not.toMatch(/javascript/i);
    expect(sanitizeWelcomeHtml('<span style=\'color: red"; x:"y\'>x</span>')).not.toMatch(/x:/);
    expect(sanitizeWelcomeHtml('<span style="color: red /* c */">x</span>')).not.toMatch(/\/\*/);
  });

  // ---- 合法排版标签保留 ----
  it('保留启用的排版标签(p/strong/em/ul/li/h2/blockquote)', () => {
    const html = '<h2>标题</h2><p><strong>粗</strong><em>斜</em></p><ul><li>项</li></ul><blockquote>引</blockquote>';
    const out = sanitizeWelcomeHtml(html);
    expect(out).toMatch(/<h2>/);
    expect(out).toMatch(/<strong>/);
    expect(out).toMatch(/<em>/);
    expect(out).toMatch(/<li>/);
    expect(out).toMatch(/<blockquote>/);
  });

  it('空串/无害文本原样', () => {
    expect(sanitizeWelcomeHtml('')).toBe('');
    expect(sanitizeWelcomeHtml('<p>纯文本 🙌</p>')).toMatch(/纯文本 🙌/);
  });

  // ---- Quill 专项(HTML 存储新增面)----
  it('保留 Quill 的 ql-* class(对齐/字号钩子)', () => {
    const out = sanitizeWelcomeHtml('<p class="ql-align-center ql-size-large">x</p>');
    expect(out).toMatch(/ql-align-center/);
    expect(out).toMatch(/ql-size-large/);
  });
  it('剔除非 ql-* class(防注入任意类名)', () => {
    const out = sanitizeWelcomeHtml('<p class="ql-align-center evil-class">x</p>');
    expect(out).toMatch(/ql-align-center/);
    expect(out).not.toMatch(/evil-class/);
  });
  it('保留合法 background-color(Quill 背景色)', () => {
    expect(sanitizeWelcomeHtml('<span style="background-color: #ff0">x</span>')).toMatch(/background-color/);
  });
  it('剔除 background 里的 url() 注入', () => {
    const out = sanitizeWelcomeHtml('<span style="background-color: url(javascript:alert(1))">x</span>');
    expect(out).not.toMatch(/url\(/i);
    expect(out).not.toMatch(/javascript/i);
  });
  it('Quill 空文档 <p><br></p> 消毒后仍是空段', () => {
    const out = sanitizeWelcomeHtml('<p><br></p>');
    expect(out).not.toMatch(/script|onerror/i);
  });
});
