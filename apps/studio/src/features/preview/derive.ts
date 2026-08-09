/**
 * 预览派生:把「schema + 当前答案」压成检查器与进度所需的纯数据。
 * 逻辑显隐走 engine `evaluate`(约束 3,与作答端/后端同一套求值)。
 * 已答判定与 runtime Fill 一致(!==undefined/null/''),保证同一问卷两端进度口径相同。
 *
 * 纯函数、零副作用、不引 runtime——studio 预览的交互内核(方案 A)。
 */
import { evaluate } from '@xingjuan/engine';
import type { SurveySchema, Question, Answers } from '@xingjuan/engine';

/** 每题在预览里的派生状态(检查器逐题清单用)。 */
export interface PreviewQuestion {
  q: Question;
  /** 在完整题序里的下标(0 基),用于展示 Q{index+1} */
  index: number;
  /** 被逻辑隐藏(不参与作答/进度/校验) */
  isHidden: boolean;
  isRequired: boolean;
  /** 仅对可见题有意义;隐藏题恒 false */
  isAnswered: boolean;
}

export interface PreviewDerived {
  /** 全部题(含隐藏),按原序,带派生态——检查器逐题清单直接遍历它 */
  items: PreviewQuestion[];
  /** 可见题(未被逻辑隐藏) */
  visible: Question[];
  /** 被逻辑隐藏的题 id 集合 */
  hidden: Set<string>;
  /** 已答的可见必答题数 */
  answeredCount: number;
  /** 可见必答题总数(隐藏题不计) */
  requiredTotal: number;
  /** 完成度百分比(requiredTotal=0 时为 100,视作无必答约束即完成) */
  pct: number;
}

/** 已答判定:与 runtime Fill.tsx 一致(空串/未定义/ null 均视作未答)。 */
export function isAnswered(value: unknown): boolean {
  return value !== undefined && value !== null && value !== '';
}

/** 给定 schema 与答案,派生预览所需的全部只读数据。 */
export function derivePreview(schema: SurveySchema, answers: Answers): PreviewDerived {
  const { hidden } = evaluate(schema.rules, answers);

  const items: PreviewQuestion[] = schema.questions.map((q, index) => {
    const isHidden = hidden.has(q.id);
    return {
      q,
      index,
      isHidden,
      isRequired: q.required === true,
      isAnswered: !isHidden && isAnswered(answers[q.id]),
    };
  });

  const visible = items.filter((it) => !it.isHidden).map((it) => it.q);
  const requiredItems = items.filter((it) => !it.isHidden && it.isRequired);
  const requiredTotal = requiredItems.length;
  const answeredCount = requiredItems.filter((it) => it.isAnswered).length;
  const pct = requiredTotal === 0 ? 100 : Math.round((answeredCount / requiredTotal) * 100);

  return { items, visible, hidden, answeredCount, requiredTotal, pct };
}
