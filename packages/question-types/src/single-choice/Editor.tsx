/** 单选题编辑态设置面板(骨架:仅题干,选项编辑待业务阶段补)。 */
import type { EditorProps } from '../types.js';

export function SingleChoiceEditor({ question, onChange }: EditorProps) {
  return (
    <div>
      <label style={{ display: 'block' }}>
        题干
        <input
          type="text"
          value={question.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </label>
    </div>
  );
}
