/**
 * 逻辑求值器。对应 PRD §9 约束 3(逻辑规则独立成表,一张表统吃显隐/跳题/引用)。
 *
 * 核心是纯函数 evaluate(rules, answers):输入声明式规则 + 当前答案,
 * 输出每题的可见性等派生状态。前后端各实现一份,靠 golden.test.ts 锁一致(决策 6)。
 * 不依赖任何 UI 框架。
 */

import type { Answers, Combinator, Condition, LogicRule } from './schema.js';

/** 求值结果:题目 id → 是否隐藏。默认可见,规则可将其置为隐藏。 */
export interface EvalResult {
  /** 被隐藏的题目 id 集合 */
  hidden: Set<string>;
}

/** 判断单个条件是否成立。空值/未作答语义集中在此,是前后端最易漂移处。 */
export function evalCondition(cond: Condition, answers: Answers): boolean {
  const a = answers[cond.qid];
  const answered = a !== undefined && a !== null && a !== '';
  switch (cond.op) {
    case 'answered':
      return answered;
    case 'empty':
      return !answered;
    case 'eq':
      return a === cond.value;
    case 'ne':
      return a !== cond.value;
    case 'includes':
      return Array.isArray(a) && a.includes(cond.value);
    case 'gt':
      return typeof a === 'number' && typeof cond.value === 'number' && a > cond.value;
    case 'lt':
      return typeof a === 'number' && typeof cond.value === 'number' && a < cond.value;
    default:
      return false;
  }
}

/** 按组合子聚合一组条件。空条件组约定为不触发(false)。 */
export function evalConditions(
  conditions: Condition[],
  combinator: Combinator,
  answers: Answers,
): boolean {
  if (conditions.length === 0) return false;
  return combinator === 'AND'
    ? conditions.every((c) => evalCondition(c, answers))
    : conditions.some((c) => evalCondition(c, answers));
}

/**
 * 求值全部规则,得出派生可见性。
 * MVP 只处理 show/hide:hide 命中 → 隐藏 target;show 命中 → 显式可见(覆盖同题的 hide)。
 * jump/pipe/end 等 action 预留,当前忽略。
 */
export function evaluate(rules: LogicRule[], answers: Answers): EvalResult {
  const hidden = new Set<string>();
  const forcedShow = new Set<string>();
  for (const rule of rules) {
    const hit = evalConditions(rule.conditions, rule.combinator, answers);
    if (!hit) continue;
    if (rule.action.type === 'hide') hidden.add(rule.action.target);
    else if (rule.action.type === 'show') forcedShow.add(rule.action.target);
  }
  for (const id of forcedShow) hidden.delete(id);
  return { hidden };
}
