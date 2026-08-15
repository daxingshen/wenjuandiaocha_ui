/**
 * 矩阵题型编辑器共用的「行 / 列」编辑块。五个矩阵编辑器的「选项」段都复用它:
 * 行(子项)增删改 + 列增删改。无列题型(填空/滑动条)只渲染行段(传 columns=null)。
 * 改的是 question.props.rows / .options,经宿主 onChange patch,与中栏画布双向同步。
 */
import { useEffect, useState } from 'react';
import '../editor.css';

/**
 * 分值输入:受控 number 输入直接 Number() 会把「2.」吞成 2,导致无法输入小数。
 * 用本地文本缓冲,允许中间态(空/负号/末尾小数点),仅在能解析为有限数时回写。
 */
export function ScoreInput({
  value,
  onChange,
  className,
}: {
  value: number | undefined;
  onChange: (v: number) => void;
  className?: string;
}) {
  const [text, setText] = useState(value === undefined ? '' : String(value));
  // 外部值变化(如切换量级重置)时同步,但不打断正在输入的等价文本。
  useEffect(() => {
    const parsed = Number(text);
    if (value !== undefined && !(text.trim() !== '' && Number.isFinite(parsed) && parsed === value)) {
      setText(String(value));
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <input
      type="number"
      step="any"
      inputMode="decimal"
      className={className}
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

/**
 * 矩阵通用「表格布局」设置块(所有矩阵题型的题型 tab 复用):
 * 第一列宽度(px) + 超宽策略(换行/横向滚动)。改的是题级 props.firstColWidth / .overflow。
 */
export function MatrixLayoutFields({
  firstColWidth,
  onChange,
}: {
  firstColWidth?: number;
  onChange: (next: { firstColWidth?: number }) => void;
}) {
  return (
    <div className="set-group">
      <div className="field">
        <label>第一列宽度（px）</label>
        <input
          type="number"
          min={40}
          value={firstColWidth ?? 100}
          placeholder="100"
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange({ firstColWidth: Number.isFinite(n) && n > 0 ? n : undefined });
          }}
        />
      </div>
    </div>
  );
}

export interface RowItem {
  id: string;
  label: string;
}
export interface ColItem {
  value: string;
  label: string;
}

interface RowsEditorProps {
  rows: RowItem[];
  setRows: (rows: RowItem[]) => void;
  /** 行段小标题,默认「行(子项)」 */
  title?: string;
}

/** 行(子项)编辑:内联改字 + ✕ 删 + ＋ 增。保底至少一行。 */
export function RowsEditor({ rows, setRows, title = '行(子项)' }: RowsEditorProps) {
  const add = () => setRows([...rows, { id: `row${rows.length + 1}`, label: `子项${rows.length + 1}` }]);
  const del = (i: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, j) => j !== i));
  };
  return (
    <div className="set-group">
      <h5>{title}</h5>
      {rows.map((r, i) => (
        <div key={i} className="opt-row">
          <input
            type="text"
            value={r.label}
            onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
          />
          <button type="button" className="del" title="删除" onClick={() => del(i)}>
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="add-opt" onClick={add}>
        ＋ 添加行
      </button>
    </div>
  );
}

interface ColsEditorProps {
  options: ColItem[];
  setOptions: (opts: ColItem[]) => void;
  /** 列段小标题,默认「列(选项)」;量表用「列(量级标签)」 */
  title?: string;
}

/** 列(选项)编辑:内联改字 + ✕ 删 + ＋ 增。保底至少一列。 */
export function ColsEditor({ options, setOptions, title = '列(选项)' }: ColsEditorProps) {
  const add = () => setOptions([...options, { value: `opt${options.length + 1}`, label: `选项${options.length + 1}` }]);
  const del = (i: number) => {
    if (options.length <= 1) return;
    setOptions(options.filter((_, j) => j !== i));
  };
  return (
    <div className="set-group">
      <h5>{title}</h5>
      {options.map((o, i) => (
        <div key={i} className="opt-row">
          <input
            type="text"
            value={o.label}
            onChange={(e) => setOptions(options.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
          />
          <button type="button" className="del" title="删除" onClick={() => del(i)}>
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="add-opt" onClick={add}>
        ＋ 添加列
      </button>
    </div>
  );
}
