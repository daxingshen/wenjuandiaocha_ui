/**
 * 逐题作答的「当前题选择」纯函数(零 DOM、零 React,便于单测)。
 * 逐题模式下每屏只渲染一题;当前题由持久化的 curId 决定,但 curId 可能因作答导致
 * 目标题被逻辑隐藏而失效——此函数把「意图指向的 curId」收敛到一个仍可见的题:
 *   - curId 命中某可见题 → 就是它;
 *   - curId 不在可见集(被隐藏 / 陈旧 / 空)→ 借原题序 order 就近回退:取「原序下标 ≤ curId」
 *     的最后一个可见题(停在被隐藏题之前那一题,符合「下一题时才前进」的直觉);
 *     无 order 或其前无可见题 → 回落首个可见题;
 *   - 可见集为空 → null(安全兜底,调用方据此渲染空态,不崩)。
 */
import type { Answers, Question } from '@xingjuan/engine';
import { isAnswered } from './fillPath.js';

/**
 * 进入逐题模式时,若无持久化指针(curId===null),把当前题一次性锚定到哪一题:
 * 首个未答的可见题,没有(全答过/续答)则首个可见题。用于组件挂载时把指针落到 state,
 * 之后当前题纯由 curId 驱动——不再随作答重算,避免「勾选当前题即被判为已答、当前题滑走」。
 * 空可见集返回 null(安全兜底)。纯函数,便于单测。
 */
export function initialCursorId(visible: Question[], answers: Answers): string | null {
  if (visible.length === 0) return null;
  const firstUnanswered = visible.find((q) => !isAnswered(answers[q.id]));
  return (firstUnanswered ?? visible[0]!).id;
}

export function pickCurrent(
  visible: Question[],
  curId: string | null | undefined,
  order?: string[],
): Question | null {
  if (visible.length === 0) return null;
  const first = visible[0]!;
  if (curId == null) return first;

  const hit = visible.find((q) => q.id === curId);
  if (hit) return hit;

  // curId 已不在可见集:借原序就近回退到「原序 ≤ curId」的最后一个可见题。
  if (order) {
    const curIdx = order.indexOf(curId);
    if (curIdx >= 0) {
      const visibleIds = new Set(visible.map((q) => q.id));
      for (let i = curIdx; i >= 0; i--) {
        const id = order[i]!;
        if (visibleIds.has(id)) return visible.find((q) => q.id === id)!;
      }
    }
  }
  return first;
}
