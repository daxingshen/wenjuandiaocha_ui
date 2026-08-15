/**
 * 矩阵填空编辑态。无列。分段:
 * - section='type':每行字数上限(可选)。
 * - section='options':每行 增删改 + 每行独立的输入框提示文案。
 */
import type { EditorProps, MatrixFillProps, MatrixLayout } from '@xingjuan/question-types';
import { MatrixLayoutFields } from '../matrix-single/shared.js';
import '../editor.css';

type FillRow = { id: string; label: string; placeholder?: string };

export function MatrixFillEditor({ question, onChange, section }: EditorProps) {
  const p = question.props as Partial<MatrixFillProps> & MatrixLayout;
  const rows = (p.rows ?? []) as FillRow[];
  const patch = (next: Record<string, unknown>) => onChange({ props: { ...question.props, ...next } });
  const setRows = (r: FillRow[]) => patch({ rows: r });

  const showType = section === 'type' || section === undefined;
  const showOptions = section === 'options' || section === undefined;

  const parseNum = (v: string): number | undefined => {
    if (v.trim() === '') return undefined;
    const n = Number(v);
    return Number.isNaN(n) ? undefined : n;
  };

  const setRow = (i: number, next: Partial<FillRow>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...next } : r)));
  const delRow = (i: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, j) => j !== i));
  };
  const addRow = () => setRows([...rows, { id: `row${rows.length + 1}`, label: `子项${rows.length + 1}` }]);

  return (
    <>
      {showType && (
        <div className="set-group">
          <div className="field">
            <label>每行字数上限（可选）</label>
            <input
              type="number"
              min={1}
              value={p.maxLength ?? ''}
              placeholder="不限"
              onChange={(e) => patch({ maxLength: parseNum(e.target.value) })}
            />
          </div>
          <MatrixLayoutFields firstColWidth={p.firstColWidth} onChange={patch} />
        </div>
      )}
      {showOptions && (
        <div className="set-group">
          <h5>行(子项)· 每行可设独立提示文案</h5>
          {rows.map((r, i) => (
            <div key={i} className="fill-row-ed">
              <div className="opt-row">
                <input
                  type="text"
                  value={r.label}
                  placeholder="行标题"
                  onChange={(e) => setRow(i, { label: e.target.value })}
                />
                <button type="button" className="del" title="删除" onClick={() => delRow(i)}>
                  ✕
                </button>
              </div>
              <input
                type="text"
                className="fill-ph-field"
                value={r.placeholder ?? ''}
                placeholder="该行输入框提示文案（可选）"
                onChange={(e) => setRow(i, { placeholder: e.target.value })}
              />
            </div>
          ))}
          <button type="button" className="add-opt" onClick={addRow}>
            ＋ 添加行
          </button>
        </div>
      )}
    </>
  );
}
