/**
 * 多项填空的 engine 侧行为(非 UI):默认 props、校验、规范化、逻辑引用。
 *
 * 「一题干、多个单行填空框」,每框可独立设标签/提示/属性验证/字数范围/默认值,可增删框。
 * 答案 { blankId: string }。normalize 每已答框一行(subId=blankId)。maxLength UTF-16 计数。
 *
 * 与 matrix-fill 的差异:每框带自己的 format/min/maxLength/defaultValue(复用共享
 * validateTextValue),而非全题共享一个 maxLength。
 */
import type { QuestionTypeHandler, Question, NormalizedRow } from '@xingjuan/engine';
import { validateTextValue, type TextFormat } from '../shared/text-format.js';

/** 一个填空框的配置。 */
export interface MultiFillBlank {
  /** 框唯一 id(题内唯一,作 answer key 与 normalize subId) */
  id: string;
  /** 框标签(显示在输入框左侧) */
  label?: string;
  /** 输入框占位提示 */
  placeholder?: string;
  /** 属性验证;省略等于 'text' */
  format?: TextFormat;
  /** 最少字数(UTF-16);省略不限 */
  minLength?: number;
  /** 最多字数(UTF-16);省略不限 */
  maxLength?: number;
  /** 默认值:作答态初始填入(纯前端回显,后端不校验) */
  defaultValue?: string;
}

/** 多项填空的 props 结构。 */
export interface MultiFillProps {
  blanks: MultiFillBlank[];
}

export type MultiFillAnswer = Record<string, string>;

function readProps(q: Question): MultiFillProps {
  const p = q.props as Partial<MultiFillProps>;
  return { blanks: Array.isArray(p.blanks) ? p.blanks : [] };
}

function readAnswer(answer: unknown): Record<string, unknown> {
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return {};
  return answer as Record<string, unknown>;
}

export const multiFillHandler: QuestionTypeHandler = {
  type: 'multi-fill',
  group: 'text',
  label: '多项填空',
  defaultProps: (): Record<string, unknown> => ({
    blanks: [
      { id: 'b1', label: '填空1' },
      { id: 'b2', label: '填空2' },
    ],
  }),
  validate: (question: Question, answer: unknown): string | null => {
    const { blanks } = readProps(question);
    const ans = readAnswer(answer);
    const blankIds = new Set(blanks.map((b) => b.id));
    // 逐框校验已答值(空框跳过,由下方必答段统一判)。
    for (const [subId, value] of Object.entries(ans)) {
      if (value === undefined || value === null || value === '') continue;
      if (!blankIds.has(subId)) return '存在不属于本题的填空框';
      const blank = blanks.find((b) => b.id === subId)!;
      const msg = validateTextValue(value, {
        format: blank.format,
        minLength: blank.minLength,
        maxLength: blank.maxLength,
      });
      if (msg) return msg;
    }
    // 必答:每框都要非空(空对象会绕过通用必答层,故在此判)。
    if (question.required) {
      const filled = (id: string) => typeof ans[id] === 'string' && (ans[id] as string) !== '';
      if (!blanks.every((b) => filled(b.id))) return '每个填空框都需作答';
    }
    return null;
  },
  normalize: (question: Question, answer: unknown): NormalizedRow[] => {
    const { blanks } = readProps(question);
    const ans = readAnswer(answer);
    const out: NormalizedRow[] = [];
    for (const b of blanks) {
      const v = ans[b.id];
      if (typeof v === 'string' && v !== '') out.push({ qid: question.id, subId: b.id, value: v });
    }
    return out;
  },
  // 逻辑引用:每个填空框可作条件源(subId=blankId);文本无离散候选值,走自由输入。
  logicRef: (question: Question) => {
    const { blanks } = readProps(question);
    return { subFields: blanks.map((b) => ({ id: b.id, label: b.label ?? b.id })) };
  },
};
