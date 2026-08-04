/** 多选题编辑态:编选项(增删改)+ min/max + 选项随机排序。题干/必答/题型由 SettingsPanel 统一管。 */
import type { EditorProps, MultiChoiceProps } from '@xingjuan/question-types';
import '../editor.css';

export function MultiChoiceEditor({ question, onChange }: EditorProps) {
  const p = question.props as Partial<MultiChoiceProps>;
  const options = p.options ?? [];
  const patch = (next: Partial<MultiChoiceProps>) => onChange({ props: { ...question.props, ...next } });
  const setOptions = (next: MultiChoiceProps['options']) => patch({ options: next });
  const numOrUndef = (v: string) => (v === '' ? undefined : Number(v));

  return (
    <div className="set-group">
      <h5>选项</h5>
      {options.map((opt, i) => (
        <div key={i} className="opt-row">
          <input
            type="text"
            value={opt.label}
            onChange={(e) => setOptions(options.map((o, j) => (j === i ? { ...o, label: e.target.value } : o)))}
          />
          <button type="button" className="del" title="删除" onClick={() => setOptions(options.filter((_, j) => j !== i))}>
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        className="add-opt"
        onClick={() => setOptions([...options, { value: `opt${options.length + 1}`, label: `选项${options.length + 1}` }])}
      >
        ＋ 添加选项
      </button>

      <h5>选择数量限制</h5>
      <div className="dual-field">
        <div className="field">
          <label>最少</label>
          <input type="number" value={p.min ?? ''} onChange={(e) => patch({ min: numOrUndef(e.target.value) })} />
        </div>
        <div className="field">
          <label>最多</label>
          <input type="number" value={p.max ?? ''} onChange={(e) => patch({ max: numOrUndef(e.target.value) })} />
        </div>
      </div>

      <div className="toggle-row">
        <span>选项随机排序</span>
        <div className={`sw${p.randomize ? ' on' : ''}`} onClick={() => patch({ randomize: !p.randomize })} />
      </div>
    </div>
  );
}
