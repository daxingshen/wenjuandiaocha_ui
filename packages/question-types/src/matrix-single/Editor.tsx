/** 矩阵单选编辑态:编子行(增删改)+ 列(增删改)。题干/必答/题型由 SettingsPanel 统一管。 */
import type { EditorProps } from '../types.js';
import type { MatrixSingleProps } from './handler.js';

export function MatrixSingleEditor({ question, onChange }: EditorProps) {
  const p = question.props as Partial<MatrixSingleProps>;
  const rows = p.rows ?? [];
  const options = p.options ?? [];
  const patch = (next: Partial<MatrixSingleProps>) => onChange({ props: { ...question.props, ...next } });

  return (
    <div className="set-group">
      <h5>子项(行)</h5>
      {rows.map((row, i) => (
        <div key={i} className="opt-row">
          <input
            type="text"
            value={row.label}
            onChange={(e) => patch({ rows: rows.map((r, j) => (j === i ? { ...r, label: e.target.value } : r)) })}
          />
          <button type="button" className="del" title="删除" onClick={() => patch({ rows: rows.filter((_, j) => j !== i) })}>
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        className="add-opt"
        onClick={() => patch({ rows: [...rows, { id: `row${rows.length + 1}`, label: `子项${rows.length + 1}` }] })}
      >
        ＋ 添加子项
      </button>

      <h5>列(选项)</h5>
      {options.map((opt, i) => (
        <div key={i} className="opt-row">
          <input
            type="text"
            value={opt.label}
            onChange={(e) => patch({ options: options.map((o, j) => (j === i ? { ...o, label: e.target.value } : o)) })}
          />
          <button type="button" className="del" title="删除" onClick={() => patch({ options: options.filter((_, j) => j !== i) })}>
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        className="add-opt"
        onClick={() => patch({ options: [...options, { value: `opt${options.length + 1}`, label: `选项${options.length + 1}` }] })}
      >
        ＋ 添加列
      </button>
    </div>
  );
}
