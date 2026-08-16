/**
 * 多项填空编辑态。配置在「输入项」段(section='input'):纵向平铺所有框 → 点选 → 对选中框操作。
 * - 框标签 / 输入框提示 / 属性验证(11 项)/ 字数范围(min·max)/ 默认值。
 * - 增删框:id 用单调计数器 `_seq`(存 props),删中间框再加不撞已删 id(修 matrix-fill 缺陷)。
 * - 选中态经宿主 selectedOptIndex/onSelectOption 提供(与画布内联双向同步)。
 * section='type' 无题型级配置(每框独立)。
 */
import type { EditorProps, MultiFillBlank, TextFormat } from '@xingjuan/question-types';
import '../editor.css';

const FORMAT_OPTIONS: Array<{ value: TextFormat; label: string }> = [
  { value: 'text', label: '不限' },
  { value: 'email', label: '邮箱' },
  { value: 'phone', label: '手机号' },
  { value: 'integer', label: '整数' },
  { value: 'decimal', label: '小数' },
  { value: 'date', label: '日期' },
  { value: 'age', label: '年龄' },
  { value: 'province', label: '省份' },
  { value: 'idcard', label: '身份证号' },
  { value: 'zipcode', label: '邮编' },
  { value: 'url', label: '网址' },
];

interface MultiFillPropsRaw {
  blanks?: MultiFillBlank[];
  /** 单调计数器:下一个框 id 的序号。缺省从 blanks 长度推算,保证不撞已删 id。 */
  _seq?: number;
}

export function MultiFillEditor({ question, onChange, section, selectedOptIndex, onSelectOption }: EditorProps) {
  const p = question.props as MultiFillPropsRaw;
  const blanks = p.blanks ?? [];
  const patch = (next: Record<string, unknown>) => onChange({ props: { ...question.props, ...next } });
  const setBlanks = (b: MultiFillBlank[], seq?: number) =>
    patch(seq === undefined ? { blanks: b } : { blanks: b, _seq: seq });
  const num = (v: string) => (v.trim() === '' ? undefined : Number(v));

  if (section === 'type') return null;

  // 选中下标兜底:宿主未提供或越界时落到第一框(与「总有一框在编辑」一致)。
  const idx = selectedOptIndex !== null && selectedOptIndex !== undefined && selectedOptIndex >= 0 && selectedOptIndex < blanks.length
    ? selectedOptIndex
    : 0;
  const b = blanks[idx];

  const setBlank = (i: number, next: Partial<MultiFillBlank>) =>
    setBlanks(blanks.map((x, j) => (j === i ? { ...x, ...next } : x)));
  const delBlank = (i: number) => {
    if (blanks.length <= 1) return;
    const next = blanks.filter((_, j) => j !== i);
    setBlanks(next);
    onSelectOption?.(Math.min(i, next.length - 1));
  };
  const addBlank = () => {
    const seq = p._seq ?? blanks.length + 1;
    setBlanks([...blanks, { id: `b${seq}`, label: `填空${seq}` }], seq + 1);
    onSelectOption?.(blanks.length);
  };

  // 输入项段(section='input' 或缺省):纵向平铺所有框选择 → 对选中框操作。
  return (
    <div className="set-group">
      <div className="field">
        <label>选择填空框</label>
        <div className="blank-picker">
          {blanks.map((x, i) => (
            <div key={i} className={`blank-pick${i === idx ? ' on' : ''}`}>
              <button type="button" className="blank-pick-label" onClick={() => onSelectOption?.(i)}>
                {x.label || `填空${i + 1}`}
              </button>
              <button
                type="button"
                className="del"
                title="删除此框"
                disabled={blanks.length <= 1}
                onClick={() => delBlank(i)}
              >
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="add-opt blank-add" onClick={addBlank}>＋ 添加填空框</button>
        </div>
      </div>

      {b && (
        <div id="opt-body">
          <div className="field">
            <label>框标签</label>
            <input
              type="text"
              value={b.label ?? ''}
              placeholder="如 姓名"
              onChange={(e) => setBlank(idx, { label: e.target.value })}
            />
          </div>
          <div className="field">
            <label>属性验证</label>
            <select value={b.format ?? 'text'} onChange={(e) => setBlank(idx, { format: e.target.value as TextFormat })}>
              {FORMAT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="dual-field">
            <div className="field">
              <label>最少字数</label>
              <input type="number" value={b.minLength ?? ''} placeholder="不限" onChange={(e) => setBlank(idx, { minLength: num(e.target.value) })} />
            </div>
            <div className="field">
              <label>最多字数</label>
              <input type="number" value={b.maxLength ?? ''} placeholder="不限" onChange={(e) => setBlank(idx, { maxLength: num(e.target.value) })} />
            </div>
          </div>
          <div className="field">
            <label>输入框提示</label>
            <input
              type="text"
              value={b.placeholder ?? ''}
              placeholder="可选"
              onChange={(e) => setBlank(idx, { placeholder: e.target.value })}
            />
          </div>
          <div className="field">
            <label>默认值（选填）</label>
            <input
              type="text"
              value={b.defaultValue ?? ''}
              onChange={(e) => setBlank(idx, { defaultValue: e.target.value === '' ? undefined : e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
