/**
 * 矩阵多选编辑态。分段:
 * - section='type':每行「至少 / 最多」选项数(留空不限)。
 * - section='options':行 + 列 增删改。
 */
import type { EditorProps, MatrixMultiProps, MatrixLayout } from '@xingjuan/question-types';
import { RowsEditor, ColsEditor, MatrixLayoutFields } from '../matrix-single/shared.js';
import '../editor.css';

export function MatrixMultiEditor({ question, onChange, section }: EditorProps) {
  const p = question.props as Partial<MatrixMultiProps> & MatrixLayout;
  const rows = p.rows ?? [];
  const options = p.options ?? [];
  const patch = (next: Record<string, unknown>) => onChange({ props: { ...question.props, ...next } });

  const showType = section === 'type' || section === undefined;
  const showOptions = section === 'options' || section === undefined;

  // 空串 → undefined(不限);数字 → number。
  const parseNum = (v: string): number | undefined => {
    if (v.trim() === '') return undefined;
    const n = Number(v);
    return Number.isNaN(n) ? undefined : n;
  };
  // 「至少」下限为 2:每行 min=1 与「必答矩阵单选」无异,故最小可设值锁 2。留空 = 不限。
  const parseMin = (v: string): number | undefined => {
    const n = parseNum(v);
    return n === undefined ? undefined : Math.max(2, n);
  };

  return (
    <>
      {showType && (
        <div className="set-group">
          <div className="dual-field">
            <div className="field">
              <label>至少选几项</label>
              <input
                type="number"
                min={2}
                value={p.min ?? ''}
                placeholder="不限"
                onChange={(e) => patch({ min: parseMin(e.target.value) })}
              />
            </div>
            <div className="field">
              <label>最多选几项</label>
              <input
                type="number"
                min={0}
                value={p.max ?? ''}
                placeholder="不限"
                onChange={(e) => patch({ max: parseNum(e.target.value) })}
              />
            </div>
          </div>
          <p style={{ color: 'var(--ink-muted)', fontSize: 11.5, marginTop: 4 }}>
            每一行分别按此上下限校验；留空表示不限。
          </p>
          <MatrixLayoutFields firstColWidth={p.firstColWidth} onChange={patch} />
        </div>
      )}
      {showOptions && (
        <>
          <RowsEditor rows={rows} setRows={(r) => patch({ rows: r })} />
          <ColsEditor options={options} setOptions={(o) => patch({ options: o })} />
        </>
      )}
    </>
  );
}
