/** 量表题作答态渲染。runtime 与 studio 预览共用。一排刻度按钮,单选一个整数。 */
import type { AnswerProps } from '../types.js';
import type { ScaleProps } from './handler.js';

export function ScaleAnswer({ question, value, onChange, disabled }: AnswerProps) {
  const p = question.props as Partial<ScaleProps>;
  const min = typeof p.min === 'number' ? p.min : 1;
  const max = typeof p.max === 'number' ? p.max : 5;
  const ticks: number[] = [];
  for (let i = min; i <= max; i++) ticks.push(i);

  return (
    <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
      <legend>{question.title}</legend>
      <div style={{ display: 'flex', gap: 6 }} role="radiogroup" aria-label={question.title}>
        {ticks.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            disabled={disabled}
            onClick={() => !disabled && onChange(n)}
            style={{ flex: 1, padding: '8px 0', fontWeight: value === n ? 700 : 400 }}
          >
            {n}
          </button>
        ))}
      </div>
      {(p.minLabel || p.maxLabel) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span>{p.minLabel}</span>
          <span>{p.maxLabel}</span>
        </div>
      )}
    </fieldset>
  );
}
