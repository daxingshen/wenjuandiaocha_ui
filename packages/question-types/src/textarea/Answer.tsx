/** 多行文本作答态渲染。runtime 与 studio 预览共用。多行输入框。 */
import type { AnswerProps } from '../types.js';
import type { TextareaProps } from './handler.js';

export function TextareaAnswer({ question, value, onChange, disabled }: AnswerProps) {
  const p = question.props as Partial<TextareaProps>;
  return (
    <label style={{ display: 'block' }}>
      {question.title}
      <textarea
        value={typeof value === 'string' ? value : ''}
        maxLength={p.maxLength}
        disabled={disabled}
        rows={4}
        style={{ width: '100%' }}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
