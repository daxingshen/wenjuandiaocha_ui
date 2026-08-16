/**
 * 单项填空作答态渲染。runtime 与 studio 预览共用。题干/提示由宿主(Fill/Preview)渲染,本组件只出控件。
 * 单行输入,控件随属性验证(format)变:province→省份下拉、date→日期、email/tel/url→对应 type、
 * integer/age/decimal/zipcode→text+inputmode。默认值 defaultValue 在挂载时写入 answers(过必答)。
 */
import { useEffect } from 'react';
import type { AnswerProps } from '../types.js';
import type { TextInputProps } from './handler.js';
import { normalizeFormat } from '../shared/text-format.js';
import { PROVINCES } from '../shared/provinces.js';

/** format → <input type> / inputmode。 */
function inputAttrs(format: string): { type: string; inputMode?: 'numeric' | 'decimal' } {
  switch (format) {
    case 'email': return { type: 'email' };
    case 'phone': return { type: 'tel' };
    case 'date': return { type: 'date' };
    case 'url': return { type: 'url' };
    case 'integer':
    case 'age':
    case 'zipcode': return { type: 'text', inputMode: 'numeric' };
    case 'decimal': return { type: 'text', inputMode: 'decimal' };
    default: return { type: 'text' };
  }
}

export function TextInputAnswer({ question, value, onChange, disabled }: AnswerProps) {
  const p = question.props as Partial<TextInputProps>;
  const format = normalizeFormat(p.format);
  const def = typeof p.defaultValue === 'string' ? p.defaultValue : '';

  // 默认值 seeding(方案 1A):挂载时若尚未作答且设了默认值,写入一次 → 计入 answers、过必答。
  // hidden 题不渲染本组件 → 天然不 seed;续答/已答时 value 非 undefined,不覆盖。
  useEffect(() => {
    if (value === undefined && def !== '' && !disabled) onChange(def);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = typeof value === 'string' ? value : def;

  if (format === 'province') {
    return (
      <select className="ans-select" value={shown} disabled={disabled} onChange={(e) => onChange(e.target.value)} aria-label={question.title}>
        <option value="">请选择省份</option>
        {PROVINCES.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
    );
  }

  const { type, inputMode } = inputAttrs(format);
  return (
    <input
      className="a-in"
      type={type}
      inputMode={inputMode}
      value={shown}
      maxLength={p.maxLength}
      disabled={disabled}
      aria-label={question.title}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
