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

/**
 * 从原始答案取出用于条件比较的标量。
 * - 有 subId:钻入矩阵子行,答案形如 { 子行id: 选项value };未答或非对象则子行取 undefined。
 * - 无 subId:若答案是「带自有 value 字段的对象」(如单选带填空 { value, text }),取其 value;
 *   否则原样返回(裸 string/number、数组、矩阵整题对象等)。这样标量题带元数据后,
 *   既有 eq/ne/answered 条件仍按选项 value 比较,不降级(见 03-design 决策1-A)。
 */
function pickComparable(raw: unknown, subId: string | undefined): unknown {
  if (subId !== undefined) {
    return raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)[subId]
      : undefined;
  }
  if (
    raw !== null &&
    typeof raw === 'object' &&
    !Array.isArray(raw) &&
    'value' in (raw as Record<string, unknown>)
  ) {
    return (raw as Record<string, unknown>).value;
  }
  return raw;
}

/**
 * 从多选答案的单个元素取比较值:裸 string/number 原样;带自有 value 字段的对象
 * (多选带填空项 { value, text })取其 value。用于 includes 逐元素比较。
 */
function pickElemValue(el: unknown): unknown {
  if (
    el !== null &&
    typeof el === 'object' &&
    !Array.isArray(el) &&
    'value' in (el as Record<string, unknown>)
  ) {
    return (el as Record<string, unknown>).value;
  }
  return el;
}

/** 判断单个条件是否成立。空值/未作答语义集中在此,是前后端最易漂移处。 */
export function evalCondition(cond: Condition, answers: Answers): boolean {
  const raw = answers[cond.qid];
  const a = pickComparable(raw, cond.subId);
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
      // 多选答案是数组;元素可能是裸 value(string),也可能是带填空的对象 { value, text }。
      // 对每个元素钻取其比较值(对象取 .value)后再比,才能匹配到带填空的选中项。
      return Array.isArray(a) && a.some((el) => pickElemValue(el) === cond.value);
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
