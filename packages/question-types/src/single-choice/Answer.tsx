/** 单选题作答态渲染。runtime 与 studio 预览共用。 */
import type { AnswerProps } from '../types.js';
import type { SingleChoiceProps } from './handler.js';

export function SingleChoiceAnswer({ question, value, onChange, disabled }: AnswerProps) {
  const options = (question.props as Partial<SingleChoiceProps>).options ?? [];
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
