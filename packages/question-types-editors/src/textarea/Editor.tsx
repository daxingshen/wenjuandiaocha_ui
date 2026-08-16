/**
 * 简答题(多行)编辑态。字数范围 + 默认值(可多行),渲染在右栏「输入项」tab(section='input')。
 * 题干/必答/题型由 SettingsPanel 统一管;section='type' 无额外内容。
 */
import type { EditorProps, TextareaProps } from '@xingjuan/question-types';
import '../editor.css';

export function TextareaEditor({ question, onChange, section }: EditorProps) {
  const p = question.props as Partial<TextareaProps>;
  const patch = (next: Partial<TextareaProps>) => onChange({ props: { ...question.props, ...next } });
  const num = (v: string) => (v === '' ? undefined : Number(v));

  if (section === 'type') return null;

  return (
    <div className="set-group">
      <div className="dual-field">
        <div className="field">
          <label>最少字数（留空不限）</label>
          <input type="number" value={p.minLength ?? ''} onChange={(e) => patch({ minLength: num(e.target.value) })} />
        </div>
        <div className="field">
          <label>最多字数（留空不限）</label>
          <input type="number" value={p.maxLength ?? ''} onChange={(e) => patch({ maxLength: num(e.target.value) })} />
        </div>
      </div>
      <div className="field">
        <label>默认值（选填，可多行）</label>
        <textarea
          rows={3}
          value={p.defaultValue ?? ''}
          placeholder="作答态初始填入，可改"
          onChange={(e) => patch({ defaultValue: e.target.value === '' ? undefined : e.target.value })}
        />
      </div>
    </div>
  );
}
