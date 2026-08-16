/**
 * 单项填空编辑态。属性验证(11 项)+ 字数范围 + 默认值,渲染在右栏「输入项」tab(section='input')。
 * 题干/必答/题型由 SettingsPanel 统一管;section='type' 无额外内容。
 */
import type { EditorProps, TextInputProps, TextFormat } from '@xingjuan/question-types';
import '../editor.css';

/** 11 项属性验证的中文标签(与作答态/后端 format 值对齐)。 */
const FORMAT_OPTIONS: Array<{ value: TextFormat; label: string }> = [
  { value: 'text', label: '不限（纯文本）' },
  { value: 'email', label: '邮箱' },
  { value: 'phone', label: '手机号' },
  { value: 'integer', label: '整数' },
  { value: 'decimal', label: '小数' },
  { value: 'date', label: '日期（YYYY-MM-DD）' },
  { value: 'age', label: '年龄（0–150）' },
  { value: 'province', label: '省份（下拉选择）' },
  { value: 'idcard', label: '身份证号' },
  { value: 'zipcode', label: '邮政编码' },
  { value: 'url', label: '网址 URL' },
];

export function TextInputEditor({ question, onChange, section }: EditorProps) {
  const p = question.props as Partial<TextInputProps>;
  const format: TextFormat = p.format ?? 'text';
  const patch = (next: Partial<TextInputProps>) => onChange({ props: { ...question.props, ...next } });
  const num = (v: string) => (v === '' ? undefined : Number(v));

  // section='type' 只出公共字段(SettingsPanel 管),本编辑器无题型层内容。
  if (section === 'type') return null;

  return (
    <div className="set-group">
      <div className="field">
        <label>属性验证</label>
        <select value={format} onChange={(e) => patch({ format: e.target.value as TextFormat })}>
          {FORMAT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div className="dual-field">
        <div className="field">
          <label>最少字数（留空不限）</label>
          <input type="number" value={p.minLength ?? ''} onChange={(e) => patch({ minLength: num(e.target.value) })} />
        </div>
        <div className="field">
          <label>最多字数（留空不限）</label>
          <input type="number" value={p.maxLength ?? ''} onChange={(e) => patch({ maxLength: num(e.target.value) })} />
        </div>
      </div>
      <div className="field">
        <label>默认值（选填）</label>
        <input
          type="text"
          value={p.defaultValue ?? ''}
          placeholder="作答态初始填入，可改"
          onChange={(e) => patch({ defaultValue: e.target.value === '' ? undefined : e.target.value })}
        />
      </div>
    </div>
  );
}
