/**
 * 下拉框作答态渲染。runtime 与 studio 预览共用。原生 <select>,首项为「请选择」占位。
 * defaultValue:answer 为空且设了默认值时,视图选中默认项——通过初始 onChange 写入答案
 * (使「默认选中」成为真正的已答值,而非仅视觉高亮)。
 */
import { useEffect, useMemo } from 'react';
import type { AnswerProps } from '../types.js';
import type { DropdownProps } from './handler.js';

/** 稳定洗牌:一次挂载定序,不随重渲染变。 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function DropdownAnswer({ question, value, onChange, disabled }: AnswerProps) {
  const p = question.props as Partial<DropdownProps>;
  const base = p.options ?? [];
  // 预览(disabled)保持原序;作答态且开随机则洗一次。
  const options = useMemo(
    () => (p.randomize && !disabled ? shuffle(base) : base),
    [question.id, p.randomize, disabled, base],
  );
  const current = typeof value === 'string' ? value : '';

  // 默认选中:作答态(非预览)首次渲染且未选时,把 defaultValue 写入答案。
  useEffect(() => {
    if (!disabled && current === '' && typeof p.defaultValue === 'string' && p.defaultValue !== '') {
      if (options.some((o) => o.value === p.defaultValue)) onChange(p.defaultValue);
    }
    // 仅在挂载/题目切换时尝试一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  return (
    <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
      <legend>{question.title}</legend>
      <select
        className="ans-select"
        value={current}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">请选择</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </fieldset>
  );
}
