/** 单选题作答态渲染。runtime 与 studio 预览共用。randomize 时作答态洗牌(预览 disabled 不洗)。 */
import { useMemo } from 'react';
import type { AnswerProps } from '../types.js';
import type { SingleChoiceProps } from './handler.js';

/** 稳定洗牌:一次挂载定序,不随重渲染变。 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function SingleChoiceAnswer({ question, value, onChange, disabled }: AnswerProps) {
  const p = question.props as Partial<SingleChoiceProps>;
  const base = p.options ?? [];
  // 预览(disabled)保持原序;作答态且开随机则洗一次
  const options = useMemo(
    () => (p.randomize && !disabled ? shuffle(base) : base),
    [question.id, p.randomize, disabled, base],
  );

  return (
    <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
      <legend>{question.title}</legend>
      {options.map((opt) => (
        <label key={opt.value} style={{ display: 'block', cursor: disabled ? 'default' : 'pointer' }}>
          <input
            type="radio"
            name={question.id}
            value={opt.value}
            checked={value === opt.value}
            disabled={disabled}
            onChange={() => onChange(opt.value)}
          />
          {opt.label}
        </label>
      ))}
    </fieldset>
  );
}
