/** 单选题编辑态:编选项(增删改)+ 选项随机排序。题干/必答/题型由 SettingsPanel 统一管。 */
import type { EditorProps } from '../types.js';
import type { SingleChoiceProps } from './handler.js';

export function SingleChoiceEditor({ question, onChange }: EditorProps) {
  const p = question.props as Partial<SingleChoiceProps>;
  const options = p.options ?? [];
  const patch = (next: Partial<SingleChoiceProps>) => onChange({ props: { ...question.props, ...next } });
  const setOptions = (opts: SingleChoiceProps['options']) => patch({ options: opts });

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

      <div className="toggle-row" style={{ marginTop: 8 }}>
        <span>选项随机排序</span>
        <div className={`sw${p.randomize ? ' on' : ''}`} onClick={() => patch({ randomize: !p.randomize })} />
      </div>
    </div>
  );
}
