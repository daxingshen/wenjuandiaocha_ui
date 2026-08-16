/**
 * 多选题作答态渲染。runtime 与 studio 预览共用。
 * 与单选对齐:arrange 排列(竖/横/双列)、隐藏项跳过、选项配图、允许填空。
 * 答案是混合数组 Array<string | {value,text}>:未填空项存裸 value,填空项存 { value, text }。
 * randomize 时作答态洗牌(预览 disabled 不洗)。
 */
import { useMemo } from 'react';
import type { AnswerProps } from '../types.js';
import type { MultiChoiceOption, MultiChoiceProps, MultiChoiceAnswerItem } from './handler.js';

/** 稳定洗牌:一次挂载定序,不随重渲染变。 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

const ARRANGE_CLASS: Record<string, string> = {
  vert: 'opt-list vert',
  horiz: 'opt-list horiz',
  grid: 'opt-list grid',
};

/** 取元素的选项 value:兼容裸 string 与 { value, text }。 */
function elemValue(item: MultiChoiceAnswerItem): string {
  return typeof item === 'string' ? item : item.value;
}

export function MultiChoiceAnswer({ question, value, onChange, disabled }: AnswerProps) {
  const p = question.props as Partial<MultiChoiceProps>;
  const base = (p.options ?? []) as MultiChoiceOption[];
  const arrange = p.arrange ?? 'vert';
  const options = useMemo(
    () => (p.randomize && !disabled ? shuffle(base) : base),
    [question.id, p.randomize, disabled, base],
  );
  const selected: MultiChoiceAnswerItem[] = Array.isArray(value) ? (value as MultiChoiceAnswerItem[]) : [];

  const indexOf = (v: string) => selected.findIndex((it) => elemValue(it) === v);
  const isChecked = (v: string) => indexOf(v) >= 0;
  const textOf = (v: string) => {
    const it = selected.find((x) => elemValue(x) === v);
    return it && typeof it === 'object' ? it.text : '';
  };

  const toggle = (opt: MultiChoiceOption) => {
    if (disabled) return;
    const i = indexOf(opt.value);
    if (i >= 0) {
      onChange(selected.filter((_, j) => j !== i));
    } else {
      // 允许填空的项以对象形入选,初始文本空;否则裸 value。
      const item: MultiChoiceAnswerItem = opt.fill?.enabled ? { value: opt.value, text: '' } : opt.value;
      onChange([...selected, item]);
    }
  };

  const setText = (v: string, text: string) => {
    if (disabled) return;
    onChange(selected.map((it) => (elemValue(it) === v ? { value: v, text } : it)));
  };

  return (
    <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
      <legend>{question.title}</legend>
      <div className={ARRANGE_CLASS[arrange] ?? ARRANGE_CLASS.vert}>
        {options.map((opt) => {
          if (opt.style?.hidden) return null;
          const checked = isChecked(opt.value);
          const labelStyle: React.CSSProperties = {
            display: 'block',
            cursor: disabled ? 'default' : 'pointer',
            color: opt.style?.color,
            fontSize: opt.style?.fontSize,
            fontWeight: opt.style?.bold ? 700 : undefined,
          };
          return (
            <label key={opt.value} style={labelStyle}>
              <input
                type="checkbox"
                value={opt.value}
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(opt)}
              />
              {opt.label}
              {opt.image?.url && (
                <img
                  src={opt.image.url}
                  alt={opt.label}
                  width={opt.image.w || undefined}
                  height={opt.image.h || undefined}
                  // 不带 Referer:规避 B 站等站点的防盗链(带 Referer 会被 403)
                  referrerPolicy="no-referrer"
                  style={{ display: 'block', marginTop: 4 }}
                />
              )}
              {opt.fill?.enabled && checked && (
                <span className="opt-fill-answer" style={{ display: 'block', marginTop: 4 }}>
                  {opt.fill.desc && <span className="opt-fill-desc">{opt.fill.desc}</span>}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {opt.fill.required && <span className="fill-req" aria-label="必填">*</span>}
                    <input
                      type="text"
                      className="opt-fill-in"
                      placeholder={opt.fill.placeholder ?? '请填写…'}
                      value={textOf(opt.value)}
                      disabled={disabled}
                      required={opt.fill.required}
                      aria-required={opt.fill.required}
                      onChange={(e) => setText(opt.value, e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </span>
                </span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
