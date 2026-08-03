/** 单项填空编辑态:编格式校验 + 最大长度。题干/必答/题型由 SettingsPanel 统一管。 */
import type { EditorProps } from '../types.js';
import type { TextInputProps, TextFormat } from './handler.js';
import '../editor.css';

export function TextInputEditor({ question, onChange }: EditorProps) {
  const p = question.props as Partial<TextInputProps>;
  const format: TextFormat = p.format ?? 'text';
  const patch = (next: Partial<TextInputProps>) => onChange({ props: { ...question.props, ...next } });

  return (
    <div className="set-group">
      <div className="field">
        <label>格式校验</label>
        <select value={format} onChange={(e) => patch({ format: e.target.value as TextFormat })}>
          <option value="text">不限</option>
          <option value="email">邮箱</option>
          <option value="phone">手机号</option>
        </select>
      </div>
      <div className="field">
        <label>最大字数(留空不限)</label>
        <input
          type="number"
          value={p.maxLength ?? ''}
          onChange={(e) => patch({ maxLength: e.target.value === '' ? undefined : Number(e.target.value) })}
        />
      </div>
    </div>
  );
}
