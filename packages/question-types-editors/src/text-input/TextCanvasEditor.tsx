/**
 * 中栏画布内文本题(填空 / 简答 / 多项填空)的内联编辑态(studio 专属)。
 * 选中时输入框可直接打字,写入 props.defaultValue(默认值)——与右栏「默认值」双向同步。
 * 多项填空:每框可内联改标签 + 打字设该框默认值 + ✕ 删框 / ＋ 增框(与右栏「选项」tab 同步)。
 * 不走作答端 Answer 组件(§15:作答端契约零负担);属性验证/字数等仍在右栏设。
 *
 * §20 上移进 editors 包:三文本题型 text-input/textarea/multi-fill 共用本组件(各自 index.ts
 * import 指向它);对宿主依赖从 useEditorStore 收敛为标准 CanvasEditorProps.onChange。
 * 每框级徽标(多项填空)在本组件内部逐框渲染,整题级徽标(单行填空)经描述符 canvasBadge 走题干区。
 * FORMAT_BADGE 亦供 text-input 描述符的 canvasBadge 复用(见 ./index.ts),归并原 studio 两处重复。
 * 全部类在 @xingjuan/ui components.css。
 */
import type { CanvasEditorProps } from '@xingjuan/question-types';
import type { MultiFillBlank, MultiFillProps, TextInputProps, TextareaProps } from '@xingjuan/question-types';
import { normalizeFormat } from '@xingjuan/question-types';

/** 属性验证 format → 画布提示徽标文案(text/缺省不标)。供每框徽标与题干 canvasBadge 共用。 */
export const FORMAT_BADGE: Record<string, string> = {
  email: '邮箱', phone: '手机号', integer: '整数', decimal: '小数', date: '日期',
  age: '年龄', province: '省份', idcard: '身份证', zipcode: '邮编', url: '网址',
};

/** format → <input type>/inputmode(与作答态 Answer 同步,画布所见即所得)。 */
function inputAttrs(format: string): { type: string; inputMode?: 'numeric' | 'decimal' } {
  switch (format) {
    case 'email': return { type: 'email' };
    case 'phone': return { type: 'tel' };
    case 'date': return { type: 'date' };
    case 'url': return { type: 'url' };
    case 'integer':
    case 'age':
    case 'zipcode': return { type: 'text', inputMode: 'numeric' };
    case 'decimal': return { type: 'text', inputMode: 'decimal' };
    default: return { type: 'text' };
  }
}

export function TextCanvasEditor({ question, onChange }: CanvasEditorProps) {
  const patch = (next: Record<string, unknown>) =>
    onChange({ props: { ...question.props, ...next } });

  // ---------- 简答(多行) ----------
  if (question.type === 'textarea') {
    const p = question.props as Partial<TextareaProps>;
    return (
      <textarea
        className="a-ta"
        value={p.defaultValue ?? ''}
        maxLength={p.maxLength}
        rows={4}
        placeholder="默认值(作答态初始填入,留空为无默认)"
        onChange={(e) => patch({ defaultValue: e.target.value === '' ? undefined : e.target.value })}
      />
    );
  }

  // ---------- 多项填空 ----------
  if (question.type === 'multi-fill') {
    const p = question.props as Partial<MultiFillProps> & { _seq?: number };
    const blanks = (p.blanks ?? []) as MultiFillBlank[];
    const setBlanks = (b: MultiFillBlank[], seq?: number) =>
      patch(seq === undefined ? { blanks: b } : { blanks: b, _seq: seq });
    const setBlank = (i: number, next: Partial<MultiFillBlank>) =>
      setBlanks(blanks.map((b, j) => (j === i ? { ...b, ...next } : b)));
    const del = (i: number) => {
      if (blanks.length <= 1) return;
      setBlanks(blanks.filter((_, j) => j !== i));
    };
    const add = () => {
      const seq = p._seq ?? blanks.length + 1;
      setBlanks([...blanks, { id: `b${seq}`, label: `填空${seq}` }], seq + 1);
    };
    return (
      <div className="multi-fill">
        {blanks.map((b, i) => {
          const fmt = normalizeFormat(b.format);
          const { type, inputMode } = inputAttrs(fmt);
          return (
            <div key={b.id} className="mf-row mf-row-ed">
              <input
                className="mf-label-in"
                value={b.label ?? ''}
                placeholder="框标签"
                onChange={(e) => setBlank(i, { label: e.target.value })}
              />
              <input
                className="a-in"
                type={type}
                inputMode={inputMode}
                value={b.defaultValue ?? ''}
                maxLength={b.maxLength}
                placeholder={b.placeholder || '默认值(选填)'}
                onChange={(e) => setBlank(i, { defaultValue: e.target.value === '' ? undefined : e.target.value })}
              />
              {FORMAT_BADGE[fmt] && <span className="fmt-badge">{FORMAT_BADGE[fmt]}</span>}
              <button type="button" className="obtn del" title="删除填空框" onClick={() => del(i)}>✕</button>
            </div>
          );
        })}
        <div className="dd-canvas-add" onClick={add}>＋ 添加填空框</div>
      </div>
    );
  }

  // ---------- 填空(单行) ----------
  const p = question.props as Partial<TextInputProps>;
  const format = normalizeFormat(p.format);
  if (format === 'province') {
    // 省份是下拉选择,画布内联编辑默认值意义不大;给一句提示,默认值在右栏设。
    return <div className="q-hint">省份题默认值在右栏「默认值」设置(下拉选省)。</div>;
  }
  const { type, inputMode } = inputAttrs(format);
  return (
    <input
      className="a-in"
      type={type}
      inputMode={inputMode}
      value={p.defaultValue ?? ''}
      maxLength={p.maxLength}
      placeholder="默认值(作答态初始填入,留空为无默认)"
      onChange={(e) => patch({ defaultValue: e.target.value === '' ? undefined : e.target.value })}
    />
  );
}
