/** 多行文本编辑态:编最大长度。题干/必答/题型由 SettingsPanel 统一管。 */
import type { EditorProps, TextareaProps } from '@xingjuan/question-types';
import '../editor.css';

export function TextareaEditor({ question, onChange }: EditorProps) {
  const p = question.props as Partial<TextareaProps>;
  return (
    <div className="set-group">
      <div className="field">
        <label>最大字数(留空不限)</label>
        <input
          type="number"
          value={p.maxLength ?? ''}
          onChange={(e) =>
            onChange({
              props: { ...question.props, maxLength: e.target.value === '' ? undefined : Number(e.target.value) },
            })
          }
        />
      </div>
    </div>
  );
}
