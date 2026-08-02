/** 多选题作答态渲染。runtime 与 studio 预览共用。答案为选中 value 的数组。randomize 时作答态洗牌。 */
import { useMemo } from 'react';
import type { AnswerProps } from '../types.js';
import type { MultiChoiceProps } from './handler.js';

/** 稳定洗牌:一次挂载定序,不随重渲染变。 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function MultiChoiceAnswer({ question, value, onChange, disabled }: AnswerProps) {
  const p = question.props as Partial<MultiChoiceProps>;
  const base = p.options ?? [];
  const options = useMemo(
    () => (p.randomize && !disabled ? shuffle(base) : base),
    [question.id, p.randomize, disabled, base],
  );
  const selected: string[] = Array.isArray(value) ? (value as string[]) : [];

  const toggle = (v: string) => {
    if (disabled) return;
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  };

  return (
    <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
      <legend>{question.title}</legend>
      {options.map((opt) => (
        <label key={opt.value} style={{ display: 'block', cursor: disabled ? 'default' : 'pointer' }}>
          <input
            type="checkbox"
            value={opt.value}
            checked={selected.includes(opt.value)}
            disabled={disabled}
            onChange={() => toggle(opt.value)}
          />
          {opt.label}
        </label>
      ))}
    </fieldset>
  );
}
