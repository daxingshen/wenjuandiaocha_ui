/**
 * 矩阵填空编辑态。无列。分段:
 * - section='type':每行字数上限(可选)+ 布局。
 * - section='options':纵向平铺子行(点选 + 每行删 + 底部加)→ 对选中行设标签/提示。
 * 选中态经宿主 selectedOptIndex/onSelectOption 提供(与画布内联双向同步)。
 */
import type { EditorProps, MatrixFillProps, MatrixLayout } from '@xingjuan/question-types';
import { MatrixLayoutFields } from '../matrix-single/shared.js';
import '../editor.css';

type FillRow = { id: string; label: string; placeholder?: string };

export function MatrixFillEditor({ question, onChange, section, selectedOptIndex, onSelectOption }: EditorProps) {
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

  // 选中下标兜底:宿主未提供或越界时落到第一行。
  const idx = selectedOptIndex !== null && selectedOptIndex !== undefined && selectedOptIndex >= 0 && selectedOptIndex < rows.length
    ? selectedOptIndex
    : 0;
  const row = rows[idx];

  const setRow = (i: number, next: Partial<FillRow>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...next } : r)));
  const delRow = (i: number) => {
    if (rows.length <= 1) return;
    const next = rows.filter((_, j) => j !== i);
    setRows(next);
    onSelectOption?.(Math.min(i, next.length - 1));
  };
  const addRow = () => {
    setRows([...rows, { id: `row${rows.length + 1}`, label: `子项${rows.length + 1}` }]);
    onSelectOption?.(rows.length);
  };

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
          <div className="field">
            <label>选择子项（行）</label>
            <div className="blank-picker">
              {rows.map((r, i) => (
                <div key={i} className={`blank-pick${i === idx ? ' on' : ''}`}>
                  <button type="button" className="blank-pick-label" onClick={() => onSelectOption?.(i)}>
                    {r.label || `子项${i + 1}`}
                  </button>
                  <button
                    type="button"
                    className="del"
                    title="删除此行"
                    disabled={rows.length <= 1}
                    onClick={() => delRow(i)}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button type="button" className="add-opt blank-add" onClick={addRow}>＋ 添加行</button>
            </div>
          </div>

          {row && (
            <div id="opt-body">
              <div className="field">
                <label>行标题</label>
                <input type="text" value={row.label} placeholder="行标题" onChange={(e) => setRow(idx, { label: e.target.value })} />
              </div>
              <div className="field">
                <label>输入框提示文案（可选）</label>
                <input type="text" value={row.placeholder ?? ''} placeholder="该行输入框提示" onChange={(e) => setRow(idx, { placeholder: e.target.value })} />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
