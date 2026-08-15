/**
 * 矩阵量表编辑态。分段:
 * - section='type':选择量级(3/5/7/10)。切换即按预设重置「列」(之后仍可在选项段/画布手工改)。
 * - section='options':行 + 列(量级标签) 增删改。
 */
import type { EditorProps, MatrixScaleProps, MatrixLayout } from '@xingjuan/question-types';
import { RowsEditor, ScoreInput, MatrixLayoutFields } from '../matrix-single/shared.js';
import '../editor.css';

type ScaleCol = { value: string; label: string; score?: number };

/** 各量级的默认列标签预设。切换量级时用它重置 options(分值默认 1..N)。 */
const LEVEL_PRESETS: Record<number, string[]> = {
  3: ['不满意', '一般', '满意'],
  4: ['很不满意', '不满意', '满意', '很满意'],
  5: ['很不满意', '不满意', '一般', '满意', '很满意'],
  7: ['极不满意', '很不满意', '不满意', '一般', '满意', '很满意', '极满意'],
  10: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
};
const LEVELS = [3, 4, 5, 7, 10];

export function MatrixScaleEditor({ question, onChange, section }: EditorProps) {
  const p = question.props as Partial<MatrixScaleProps> & MatrixLayout;
  const rows = p.rows ?? [];
  const options = p.options ?? [];
  const level = p.level ?? options.length ?? 5;
  const patch = (next: Record<string, unknown>) => onChange({ props: { ...question.props, ...next } });

  const showType = section === 'type' || section === undefined;
  const showOptions = section === 'options' || section === undefined;

  const cols = options as ScaleCol[];
  const setCols = (next: ScaleCol[]) => patch({ options: next });

  // 切换量级:按预设重置 options(value 稳定 s1..sN,分值默认 1..N),记录 level。
  const setLevel = (n: number) => {
    const labels = LEVEL_PRESETS[n] ?? [];
    const opts = labels.map((label, i) => ({ value: `s${i + 1}`, label, score: i + 1 }));
    patch({ level: n, options: opts });
  };

  const setColLabel = (i: number, label: string) => setCols(cols.map((c, j) => (j === i ? { ...c, label } : c)));
  const setColScore = (i: number, score: number) => setCols(cols.map((c, j) => (j === i ? { ...c, score } : c)));
  const delCol = (i: number) => {
    if (cols.length <= 1) return;
    setCols(cols.filter((_, j) => j !== i));
  };
  const addCol = () => setCols([...cols, { value: `s${cols.length + 1}`, label: `量级${cols.length + 1}`, score: cols.length + 1 }]);

  return (
    <>
      {showType && (
        <div className="set-group">
          <div className="field">
            <label>选择量级</label>
            <select value={level} onChange={(e) => setLevel(Number(e.target.value))}>
              {LEVELS.map((n) => (
                <option key={n} value={n}>
                  {n} 级
                </option>
              ))}
            </select>
            <p style={{ color: 'var(--ink-muted)', fontSize: 11.5, marginTop: 4 }}>
              切换量级会按预设重置下方列（之后仍可手工改标签 / 增删列）。
            </p>
          </div>
          <MatrixLayoutFields firstColWidth={p.firstColWidth} onChange={patch} />
        </div>
      )}
      {showOptions && (
        <>
          <RowsEditor rows={rows} setRows={(r) => patch({ rows: r })} />
          <div className="set-group">
            <h5>列(量级标签 + 分值)</h5>
            {cols.map((c, i) => (
              <div key={i} className="opt-row">
                <input
                  type="text"
                  value={c.label}
                  placeholder="量级标签"
                  onChange={(e) => setColLabel(i, e.target.value)}
                />
                <ScoreInput className="score-in" value={c.score} onChange={(n) => setColScore(i, n)} />
                <button type="button" className="del" title="删除" onClick={() => delCol(i)}>
                  ✕
                </button>
              </div>
            ))}
            <button type="button" className="add-opt" onClick={addCol}>
              ＋ 添加列
            </button>
          </div>
        </>
      )}
    </>
  );
}
