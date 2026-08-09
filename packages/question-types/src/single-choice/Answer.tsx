/** 单选题作答态渲染。runtime 与 studio 预览共用。randomize 时作答态洗牌(预览 disabled 不洗)。 */
import { useMemo } from 'react';
import type { AnswerProps } from '../types.js';
import type { SingleChoiceOption, SingleChoiceProps } from './handler.js';

/** 稳定洗牌:一次挂载定序,不随重渲染变。 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** 读选中的选项 value:兼容裸 string 与对象形 { value, text }。 */
function selectedValue(v: unknown): string | undefined {
  if (typeof v === 'string') return v;
  if (v !== null && typeof v === 'object' && typeof (v as { value?: unknown }).value === 'string') {
    return (v as { value: string }).value;
  }
  return undefined;
}

/** 读填空文本;裸 string / 无 text 时为 ''。 */
function selectedText(v: unknown): string {
  if (v !== null && typeof v === 'object' && typeof (v as { text?: unknown }).text === 'string') {
    return (v as { text: string }).text;
  }
  return '';
}

const ARRANGE_CLASS: Record<string, string> = {
  vert: 'opt-list vert',
  horiz: 'opt-list horiz',
  grid: 'opt-list grid',
};

export function SingleChoiceAnswer({ question, value, onChange, disabled }: AnswerProps) {
  const p = question.props as Partial<SingleChoiceProps>;
  const base = (p.options ?? []) as SingleChoiceOption[];
  const arrange = p.arrange ?? 'vert';
  // 预览(disabled)保持原序;作答态且开随机则洗一次
  const options = useMemo(
    () => (p.randomize && !disabled ? shuffle(base) : base),
    [question.id, p.randomize, disabled, base],
  );

  const curValue = selectedValue(value);
  const curText = selectedText(value);

  const pick = (opt: SingleChoiceOption) => {
    if (opt.fill?.enabled) onChange({ value: opt.value, text: curValue === opt.value ? curText : '' });
    else onChange(opt.value);
  };

  return (
    <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
      <legend>{question.title}</legend>
      <div className={ARRANGE_CLASS[arrange] ?? ARRANGE_CLASS.vert}>
        {options.map((opt) => {
          if (opt.style?.hidden) return null;
          const checked = curValue === opt.value;
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
                type="radio"
                name={question.id}
                value={opt.value}
                checked={checked}
                disabled={disabled}
                onChange={() => pick(opt)}
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
                      value={curText}
                      disabled={disabled}
                      required={opt.fill.required}
                      aria-required={opt.fill.required}
                      onChange={(e) => onChange({ value: opt.value, text: e.target.value })}
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
