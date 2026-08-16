/**
 * 多行文本作答态渲染。runtime 与 studio 预览共用。题干/提示由宿主渲染,本组件只出控件(多行框)。
 * 默认值 defaultValue(可含换行)在挂载时写入 answers(方案 1A,过必答)。
 */
import { useEffect } from 'react';
import type { AnswerProps } from '../types.js';
import type { TextareaProps } from './handler.js';

export function TextareaAnswer({ question, value, onChange, disabled }: AnswerProps) {
  const p = question.props as Partial<TextareaProps>;
  const def = typeof p.defaultValue === 'string' ? p.defaultValue : '';

  // 默认值 seeding(方案 1A):挂载时若尚未作答且设了默认值,写入一次。hidden 题不渲染 → 不 seed。
  useEffect(() => {
    if (value === undefined && def !== '' && !disabled) onChange(def);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = typeof value === 'string' ? value : def;
  return (
    <textarea
      className="a-ta"
      value={shown}
      maxLength={p.maxLength}
      disabled={disabled}
      rows={4}
      aria-label={question.title}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
