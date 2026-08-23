/**
 * 欢迎页富内容消毒(安全核心)。内容来自 react-quill-new(Quill 2)产出的 HTML 串。
 *
 * 信任模型:内容作者=问卷创建者(可信角色),风险=创建者注入脚本坑自己问卷的作答者。
 * 渲染前把 Quill HTML 过 DOMPurify:
 *  1. 标签白名单 = Quill 排版产出的标签(p/br/strong/em/u/s/ol/ul/li/h1-3/blockquote/pre 等)。
 *  2. 属性白名单 = style + class;class 仅放行 `ql-*`(Quill 的对齐/字号 CSS 钩子,无脚本面);
 *     style 逐值校验,仅留 color / background-color / font-size,拒 url()/expression/js:/断逃。
 *  字体/颜色开放任意值(用户拍板),但值必须落在安全子集。
 *
 * studio 编辑预览与 runtime 只读渲染共用本函数 —— 消毒规则单一真相源,不在两处漂移。
 */
import DOMPurify from 'dompurify';

// Quill 排版产出的标签(不开链接/图片,收窄面)。
const ALLOWED_TAGS = [
  'p', 'br', 'span',
  'strong', 'b', 'em', 'i', 's', 'u', 'code',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'pre',
  'ul', 'ol', 'li',
];

// 放行 style(承载 color/background-color/font-size)+ class(仅 ql-* 通过 hook 过滤)。
const ALLOWED_ATTR = ['style', 'class'];

// class 仅允许 Quill 的 ql-* 钩子(对齐/字号/缩进),其余一律剔。
function filterClass(cls: string): string {
  return cls
    .split(/\s+/)
    .filter((c) => /^ql-[\w-]+$/.test(c))
    .join(' ');
}

// style 里放行的属性名(Quill 用 inline color/background;font-family/size 多走 class,但也放行 inline)。
const STYLE_PROPS = new Set(['color', 'background-color', 'font-family', 'font-size']);

// 危险 token:出现即判定该 style 声明不安全,整条丢弃。
const DANGEROUS = /url\s*\(|expression\s*\(|javascript:|<|\/\*|\*\/|;|@import|&#/i;

// 合法值形状(逐属性)。
const COLOR_RE = /^#(?:[0-9a-f]{3,8})$|^rgba?\([\d\s.,%]+\)$|^hsla?\([\d\s.,%]+\)$|^[a-z]+$/i;
const FONT_FAMILY_RE = /^[\w\s,'"-]+$/; // 字体名单:字母数字空格逗号连字符与引号(用于带引号字体名)
const FONT_SIZE_RE = /^\d+(?:\.\d+)?(?:px|pt|em|rem|%)$/;

function safeStyleValue(prop: string, value: string): boolean {
  if (DANGEROUS.test(value)) return false;
  const v = value.trim();
  if (prop === 'color' || prop === 'background-color') return COLOR_RE.test(v);
  if (prop === 'font-family') return FONT_FAMILY_RE.test(v);
  if (prop === 'font-size') return FONT_SIZE_RE.test(v);
  return false;
}

/** 把一条 style 字符串过滤成只含白名单属性 + 合法值的安全 style;无安全声明返回空串。 */
function filterStyle(style: string): string {
  const out: string[] = [];
  for (const decl of style.split(';')) {
    const idx = decl.indexOf(':');
    if (idx < 0) continue;
    const prop = decl.slice(0, idx).trim().toLowerCase();
    const value = decl.slice(idx + 1).trim();
    if (!STYLE_PROPS.has(prop)) continue;
    if (!value || !safeStyleValue(prop, value)) continue;
    out.push(`${prop}: ${value}`);
  }
  return out.join('; ');
}

let hookInstalled = false;
function ensureHook() {
  if (hookInstalled) return;
  // 属性级 style 白名单:DOMPurify 在裁决每个属性时回调。scope 到全局一次注册即可(纯函数、无状态)。
  DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
    if (data.attrName === 'style') {
      const safe = filterStyle(data.attrValue);
      if (safe) data.attrValue = safe;
      else data.keepAttr = false; // 无安全声明:剔除整个 style 属性
      return;
    }
    if (data.attrName === 'class') {
      const safe = filterClass(data.attrValue);
      if (safe) data.attrValue = safe;
      else data.keepAttr = false; // 无 ql-* 类:剔除整个 class 属性
    }
  });
  hookInstalled = true;
}

/** 消毒 HTML 字符串,返回安全 HTML。空输入返回空串。 */
export function sanitizeWelcomeHtml(html: string): string {
  if (!html) return '';
  ensureHook();
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // 显式禁掉可承载脚本/交互的东西(纵深防御,即便白名单没列)。
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'img', 'a', 'form', 'input'],
    ALLOW_DATA_ATTR: false,
  });
}
