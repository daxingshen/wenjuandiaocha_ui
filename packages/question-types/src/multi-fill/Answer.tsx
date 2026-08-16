/**
 * 多项填空作答态渲染。runtime 与 studio 预览共用。
 * 每框一行:框标签 + 单行输入(控件随该框 format 变,province→省份下拉)。
 * 默认值:挂载时把所有设了 defaultValue 的框一次性写入 answers(方案 1A,过必答)。
 */
import { useEffect } from 'react';
import type { AnswerProps } from '../types.js';
import type { MultiFillProps, MultiFillAnswer } from './handler.js';
import { normalizeFormat } from '../shared/text-format.js';
import { PROVINCES } from '../shared/provinces.js';

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

export function MultiFillAnswerView({ question, value, onChange, disabled }: AnswerProps) {
  const p = question.props as Partial<MultiFillProps>;
  const blanks = p.blanks ?? [];
  const ans: MultiFillAnswer =
    value && typeof value === 'object' && !Array.isArray(value) ? (value as MultiFillAnswer) : {};

  // 默认值 seeding(方案 1A):挂载时若尚未作答,把所有设了默认值的框一次性写入。
  useEffect(() => {
    if (value !== undefined || disabled) return;
    const seed: MultiFillAnswer = {};
    for (const b of blanks) {
      if (typeof b.defaultValue === 'string' && b.defaultValue !== '') seed[b.id] = b.defaultValue;
    }
    if (Object.keys(seed).length > 0) onChange(seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setText = (blankId: string, text: string) => {
    if (disabled) return;
    onChange({ ...ans, [blankId]: text });
  };

  return (
    <div className="multi-fill">
      {blanks.map((b) => {
        const format = normalizeFormat(b.format);
        const shown = typeof ans[b.id] === 'string' ? ans[b.id] : (b.defaultValue ?? '');
        return (
          <div key={b.id} className="mf-row">
            {b.label ? <span className="mf-label">{b.label}</span> : null}
            {format === 'province' ? (
              <select className="ans-select" value={shown} disabled={disabled} onChange={(e) => setText(b.id, e.target.value)} aria-label={b.label}>
                <option value="">请选择省份</option>
                {PROVINCES.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            ) : (
              <input
                className="a-in"
                {...inputAttrs(format)}
                value={shown}
                maxLength={b.maxLength}
                placeholder={b.placeholder || '请填写…'}
                disabled={disabled}
                onChange={(e) => setText(b.id, e.target.value)}
                aria-label={b.label}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
