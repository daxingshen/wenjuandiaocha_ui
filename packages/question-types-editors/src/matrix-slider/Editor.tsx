/**
 * 矩阵滑动条编辑态。无列。分段:
 * - section='type':最小值 / 最大值 / 滑动间隔。
 * - section='options':行 增删改(无列)。
 */
import type { EditorProps, MatrixSliderProps, MatrixLayout } from '@xingjuan/question-types';
import { RowsEditor, MatrixLayoutFields } from '../matrix-single/shared.js';
import '../editor.css';

export function MatrixSliderEditor({ question, onChange, section }: EditorProps) {
  const p = question.props as Partial<MatrixSliderProps> & MatrixLayout;
  const rows = p.rows ?? [];
  const patch = (next: Record<string, unknown>) => onChange({ props: { ...question.props, ...next } });

  const showType = section === 'type' || section === undefined;
  const showOptions = section === 'options' || section === undefined;

  const num = (v: string, fallback: number): number => {
    const n = Number(v);
    return Number.isNaN(n) ? fallback : n;
  };

  return (
    <>
      {showType && (
        <div className="set-group">
          <div className="tri-field">
            <div className="field">
              <label>最小值</label>
              <input type="number" value={p.min ?? 0} onChange={(e) => patch({ min: num(e.target.value, 0) })} />
            </div>
            <div className="field">
              <label>最大值</label>
              <input type="number" value={p.max ?? 100} onChange={(e) => patch({ max: num(e.target.value, 100) })} />
            </div>
            <div className="field">
              <label>滑动间隔</label>
              <input
                type="number"
                min={1}
                value={p.step ?? 1}
                onChange={(e) => patch({ step: Math.max(1, num(e.target.value, 1)) })}
              />
            </div>
          </div>
          <p style={{ color: 'var(--ink-muted)', fontSize: 11.5, marginTop: 4 }}>
            未拖动的行显示「未设」，必答时须每行都拖动。
          </p>
          <MatrixLayoutFields firstColWidth={p.firstColWidth} onChange={patch} />
        </div>
      )}
      {showOptions && <RowsEditor rows={rows} setRows={(r) => patch({ rows: r })} />}
    </>
  );
}
