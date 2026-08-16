/**
 * 文本题共享校验:11 项属性验证 format + 通用 `validateTextValue`。
 *
 * 填空(text-input)、多项填空(multi-fill 每框)共用这一份,避免正则/边界两处漂移。
 * 后端有一份对齐实现(`internal/domain/qtype/text.go` 的 validateTextValue + provinces.go),
 * 前后端逐字对齐;改这里先想清楚后端也要跟着改。
 *
 * maxLength/minLength 用 UTF-16 code unit 计数(JS `string.length`),后端 utf16Len 对齐。
 */
import { PROVINCE_SET } from './provinces.js';

/** 单行文本属性验证类型(11 项)。省略等于 'text'(不校验格式)。 */
export type TextFormat =
  | 'text'
  | 'email'
  | 'phone'
  | 'integer'
  | 'decimal'
  | 'date'
  | 'age'
  | 'province'
  | 'idcard'
  | 'zipcode'
  | 'url';

/** 归一 format:非法/缺省一律 'text'。 */
export function normalizeFormat(f: unknown): TextFormat {
  const all: TextFormat[] = [
    'text', 'email', 'phone', 'integer', 'decimal', 'date', 'age', 'province', 'idcard', 'zipcode', 'url',
  ];
  return (all as string[]).includes(f as string) ? (f as TextFormat) : 'text';
}

// 正则:前后端逐字一致。邮箱够用即可(体验校验,后端权威再校验)。
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^1\d{10}$/;
const INTEGER_RE = /^-?\d+$/;
const DECIMAL_RE = /^-?\d+(\.\d+)?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const AGE_RE = /^\d+$/;
const ZIPCODE_RE = /^\d{6}$/;
const URL_RE = /^https?:\/\/\S+$/;
const IDCARD_RE = /^\d{17}[\dXx]$/;

/** 日期合法日历日校验(正则过后再查)。YYYY-MM-DD 且年月日相符。 */
function isValidDate(s: string): boolean {
  const parts = s.split('-').map(Number);
  const y = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const d = parts[2] ?? 0;
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

/** 身份证 mod-11-2 校验码(GB 11643-1999)。前 17 位加权和 → 校验位。 */
function isValidIdcard(s: string): boolean {
  if (!IDCARD_RE.test(s)) return false;
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checks = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  let sum = 0;
  for (let i = 0; i < 17; i++) sum += Number(s[i]) * (weights[i] ?? 0);
  return checks[sum % 11] === (s[17] ?? '').toUpperCase();
}

/** 属性验证正则/边界不符时的错误文案。format='text' 恒通过。 */
function checkFormat(value: string, format: TextFormat): string | null {
  switch (format) {
    case 'email':
      return EMAIL_RE.test(value) ? null : '邮箱格式不正确';
    case 'phone':
      return PHONE_RE.test(value) ? null : '手机号格式不正确';
    case 'integer':
      return INTEGER_RE.test(value) ? null : '请填写整数';
    case 'decimal':
      return DECIMAL_RE.test(value) ? null : '请填写数字';
    case 'date':
      return DATE_RE.test(value) && isValidDate(value) ? null : '日期格式应为 YYYY-MM-DD';
    case 'age':
      return AGE_RE.test(value) && Number(value) >= 0 && Number(value) <= 150
        ? null
        : '年龄应为 0–150 的整数';
    case 'province':
      return PROVINCE_SET.has(value) ? null : '请选择省份';
    case 'idcard':
      return isValidIdcard(value) ? null : '身份证号格式不正确';
    case 'zipcode':
      return ZIPCODE_RE.test(value) ? null : '邮编应为 6 位数字';
    case 'url':
      return URL_RE.test(value) ? null : '网址格式不正确';
    case 'text':
    default:
      return null;
  }
}

/** 文本框校验配置(填空整题 / 多项填空每框共用)。 */
export interface TextRules {
  format?: TextFormat;
  minLength?: number;
  maxLength?: number;
}

/**
 * 校验一个非空文本值。返回错误串或 null(通过)。
 * 顺序:类型 → 最多字数 → 最少字数 → 属性验证。空串由调用方(通用必答层)决定是否豁免。
 */
export function validateTextValue(value: unknown, rules: TextRules): string | null {
  if (typeof value !== 'string') return '答案格式应为文本';
  const { format, minLength, maxLength } = rules;
  if (maxLength !== undefined && value.length > maxLength) return `不超过 ${maxLength} 个字符`;
  if (minLength !== undefined && value.length < minLength) return `至少 ${minLength} 个字符`;
  return checkFormat(value, normalizeFormat(format));
}
