/**
 * 中栏画布内选中矩阵题的「编辑态」表格(studio 专属,决策6):
 * 行标签 / 列标签可内联改字、✕ 删行删列、＋ 增行增列;作答控件渲染为 disabled 占位(仅示意)。
 * 改的是 question.props.rows / .options,经 CanvasEditorProps.onChange patch,与右栏「选项」tab 双向同步。
 * 不走作答端 Answer(那是只读预览);作答端契约 AnswerProps 因此零负担。
 *
 * 五题型 matrix-single/multi/scale/fill/slider 共用本组件(§20 上移进 editors 包,由 5 个
 * 矩阵目录 registerEditor 时各自 import 指向它);对宿主依赖从 useEditorStore 收敛为标准 CanvasEditorProps。
 * matrix-single/matrix-multi/matrix-scale 有列;matrix-fill/matrix-slider 无列。
 * 全部类在 @xingjuan/ui components.css(与作答共享),不引 editor.css。
 */
import { useEffect, useState } from 'react';
import type { CanvasEditorProps } from '@xingjuan/question-types';
import { matrixWrapProps } from '@xingjuan/question-types';

/**
 * 分值输入:受控 number 直接 Number() 会把「2.」吞成 2,无法输入小数。
 * 本地文本缓冲允许中间态,仅在能解析为有限数时回写。
 */
function ScoreInput({ value, onChange }: { value: number | undefined; onChange: (v: number) => void }) {
  const [text, setText] = useState(value === undefined ? '' : String(value));
  useEffect(() => {
    const parsed = Number(text);
    if (value !== undefined && !(text.trim() !== '' && Number.isFinite(parsed) && parsed === value)) {
      setText(String(value));
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <input
      className="lbl-in score-cell"
      type="number"
      step="any"
      inputMode="decimal"
      value={text}
      placeholder="分值"
      title="分值"
      onChange={(e) => {
        const t = e.target.value;
        setText(t);
        const n = Number(t);
        if (t.trim() !== '' && Number.isFinite(n)) onChange(n);
      }}
    />
  );
}

interface Row {
  id: string;
  label: string;
}
interface Col {
  value: string;
  label: string;
  score?: number;
}

/** 哪些矩阵题型有列。 */
const HAS_COLUMNS = new Set(['matrix-single', 'matrix-multi', 'matrix-scale']);

export function MatrixCanvasEditor({ question, onChange }: CanvasEditorProps) {
  const p = question.props as {
    rows?: Row[];
    options?: Col[];
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
  };
  const rows = p.rows ?? [];
  const options = p.options ?? [];
  const hasCols = HAS_COLUMNS.has(question.type);
  const type = question.type;
  const isScale = question.type === 'matrix-scale';
  const wrap = matrixWrapProps(question.props);

  const patch = (next: Record<string, unknown>) =>
    onChange({ props: { ...question.props, ...next } });

  const setRowLabel = (i: number, label: string) =>
    patch({ rows: rows.map((r, j) => (j === i ? { ...r, label } : r)) });
  const delRow = (i: number) => {
    if (rows.length <= 1) return;
    patch({ rows: rows.filter((_, j) => j !== i) });
  };
  const addRow = () => patch({ rows: [...rows, { id: `row${rows.length + 1}`, label: `子项${rows.length + 1}` }] });

  const setColLabel = (i: number, label: string) =>
    patch({ options: options.map((o, j) => (j === i ? { ...o, label } : o)) });
  const delCol = (i: number) => {
    if (options.length <= 1) return;
    patch({ options: options.filter((_, j) => j !== i) });
  };
  const addCol = () =>
    patch({
      options: [
        ...options,
        isScale
          ? { value: `s${options.length + 1}`, label: `量级${options.length + 1}`, score: options.length + 1 }
          : { value: `opt${options.length + 1}`, label: `选项${options.length + 1}` },
      ],
    });
  const setColScore = (i: number, score: number) =>
    patch({ options: options.map((o, j) => (j === i ? { ...o, score } : o)) });

  return (
    <div onClick={(e) => e.stopPropagation()}>
    <div className={wrap.className} style={wrap.style}>
    <table className={`matrix matrix-canvas-ed ${type}`}>
      {hasCols && (
        <thead>
          <tr>
            <th className="mtx-scale-corner" />
            {options.map((opt, i) => (
              <th key={i}>
                <div className="lbl-cell">
                  <input
                    className="lbl-in colhead"
                    value={opt.label}
                    placeholder="列标题"
                    onChange={(e) => setColLabel(i, e.target.value)}
                  />
                  <button type="button" className="xbtn" title="删除列" onClick={() => delCol(i)}>
                    ✕
                  </button>
                </div>
              </th>
            ))}
            <th className="addcol-cell" rowSpan={isScale ? 2 : 1}>
              <button type="button" className="addcol" onClick={addCol}>
                ＋ 列
              </button>
            </th>
          </tr>
          {isScale && (
            <tr className="mtx-scale-scores">
              <th className="mtx-scale-corner">分值</th>
              {options.map((opt, i) => (
                <th key={i}>
                  <ScoreInput value={opt.score} onChange={(n) => setColScore(i, n)} />
                </th>
              ))}
            </tr>
          )}
        </thead>
      )}
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            <th scope="row">
              <div className="lbl-cell">
                <input
                  className="lbl-in"
                  value={row.label}
                  placeholder="行标题"
                  onChange={(e) => setRowLabel(i, e.target.value)}
                />
                <button type="button" className="xbtn" title="删除行" onClick={() => delRow(i)}>
                  ✕
                </button>
              </div>
            </th>
            <RowCells
              type={type}
              hasCols={hasCols}
              options={options}
              slider={p}
              fillPlaceholder={(row as { placeholder?: string }).placeholder}
              onFillPlaceholder={(v) =>
                patch({ rows: rows.map((r, j) => (j === i ? { ...r, placeholder: v } : r)) })
              }
            />
          </tr>
        ))}
      </tbody>
    </table>
    </div>
    <button type="button" className="addcol" style={{ marginTop: 10 }} onClick={addRow}>
      ＋ 添加行
    </button>
    </div>
  );
}

/** 行内的作答控件占位(disabled,仅示意布局)。矩阵填空的提示文案可就地编辑(题级共享)。 */
function RowCells({
  type,
  hasCols,
  options,
  slider,
  fillPlaceholder,
  onFillPlaceholder,
}: {
  type: string;
  hasCols: boolean;
  options: Col[];
  slider: { min?: number; max?: number; step?: number };
  fillPlaceholder?: string;
  onFillPlaceholder?: (v: string) => void;
}) {
  if (hasCols) {
    const control = type === 'matrix-multi' ? 'checkbox' : 'radio';
    return (
      <>
        {options.map((_, j) => (
          <td key={j}>
            <input type={control} disabled />
          </td>
        ))}
        <td />
      </>
    );
  }
  if (type === 'matrix-fill') {
    // 每行独立提示文案:就地编辑本行的 placeholder(虚线框示意可编辑)。
    return (
      <td>
        <input
          className="cell-in fill-ph-edit"
          value={fillPlaceholder ?? ''}
          placeholder="该行提示文案（作答者可见）…"
          onChange={(e) => onFillPlaceholder?.(e.target.value)}
        />
      </td>
    );
  }
  // matrix-slider
  const min = slider.min ?? 0;
  const max = slider.max ?? 100;
  const step = slider.step && slider.step > 0 ? slider.step : 1;
  return (
    <td>
      <div className="mtx-slider">
        <span className="anchor">{min}</span>
        <input type="range" className="unset" min={min} max={max} step={step} defaultValue={(min + max) / 2} disabled />
        <span className="anchor anchor-max">{max}</span>
      </div>
    </td>
  );
}
