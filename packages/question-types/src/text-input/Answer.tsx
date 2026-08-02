/** 单项填空作答态渲染。runtime 与 studio 预览共用。单行输入,type 随 format 变。 */
import type { AnswerProps } from '../types.js';
import type { TextInputProps } from './handler.js';

export function TextInputAnswer({ question, value, onChange, disabled }: AnswerProps) {
  const p = question.props as Partial<TextInputProps>;
  const inputType = p.format === 'email' ? 'email' : p.format === 'phone' ? 'tel' : 'text';
  return (
    <label style={{ display: 'block' }}>
      {question.title}
      <input
        type={inputType}
        value={typeof value === 'string' ? value : ''}
        maxLength={p.maxLength}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
