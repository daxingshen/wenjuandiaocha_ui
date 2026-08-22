/**
 * 逐题作答「当前题选择」纯函数单测(零 DOM)。锁死三档语义:
 * curId 命中可见题 → 原题;curId 已不在可见集(被逻辑隐藏)→ 就近取「原序 ≤ 它」的最后一个可见题;
 * 可见集为空 → null(安全兜底,不崩)。
 */
import { describe, it, expect } from 'vitest';
import type { Answers, Question } from '@xingjuan/engine';
import { initialCursorId, pickCurrent } from './pickCurrent.js';

const q = (id: string, required = false): Question => ({ id, type: 'text-input', title: id, required, props: {} });

describe('pickCurrent', () => {
  it('curId 命中可见题 → 返回该题', () => {
    const visible = [q('q1'), q('q2'), q('q3')];
    expect(pickCurrent(visible, 'q2')?.id).toBe('q2');
  });

  it('curId 为空(初次)→ 返回首个可见题', () => {
    const visible = [q('q1'), q('q2')];
    expect(pickCurrent(visible, null)?.id).toBe('q1');
    expect(pickCurrent(visible, undefined)?.id).toBe('q1');
  });

  it('curId 不在可见集(题被隐藏)→ 就近取原序 ≤ 它的最后一个可见题', () => {
    // 原序 q1 q2 q3 q4;q2/q3 被隐藏,可见只剩 q1 q4;curId=q3(已隐藏)→ 落到 q1(≤ q3 的最近可见)
    const order = ['q1', 'q2', 'q3', 'q4'];
    const visible = [q('q1'), q('q4')];
    expect(pickCurrent(visible, 'q3', order)?.id).toBe('q1');
  });

  it('curId 已隐藏且其前无可见题 → 回落首个可见题', () => {
    const order = ['q1', 'q2', 'q3'];
    const visible = [q('q3')]; // q1/q2 隐藏,curId=q2 已隐藏,前面无可见 → 首个可见 q3
    expect(pickCurrent(visible, 'q2', order)?.id).toBe('q3');
  });

  it('可见集为空 → null(兜底不崩)', () => {
    expect(pickCurrent([], 'q1')).toBeNull();
    expect(pickCurrent([], null)).toBeNull();
  });

  it('无 order 且 curId 不在可见集 → 回落首个可见题', () => {
    const visible = [q('q2'), q('q3')];
    expect(pickCurrent(visible, 'q9')?.id).toBe('q2');
  });

  // 防"勾一个选项就跳题"回归的核心不变量:pickCurrent 只认 curId、完全不看 answers,
  // 故当前题一旦锚定,作答它(哪怕单选多选只勾一个)都不会让 cur 滑到下一题。
  it('curId 命中的题即便已作答也返回它自身(当前题不因作答而滑走)', () => {
    const visible = [q('q1', true), q('q2'), q('q3')];
    // 无论 q1 是否已答,pickCurrent 都只依据 curId 返回 q1(签名里根本没有 answers)。
    expect(pickCurrent(visible, 'q1')?.id).toBe('q1');
  });
});

describe('initialCursorId(进入逐题的指针锚定,仅在无持久指针时用一次)', () => {
  it('全未答(新鲜进入)→ 锚定首个可见题', () => {
    const visible = [q('q1'), q('q2'), q('q3')];
    expect(initialCursorId(visible, {})).toBe('q1');
  });

  it('首题已答、次题未答(续答)→ 锚定首个未答题', () => {
    // 续答语义:回到用户上次没答完的地方。这只在"进入时无持久 curId"发生一次;
    // 锚定后 curId 落 state,之后当前题纯由 curId 驱动,不再随作答重算。
    const visible = [q('q1'), q('q2'), q('q3')];
    const answers: Answers = { q1: 'done' };
    expect(initialCursorId(visible, answers)).toBe('q2');
  });

  it('全部答过 → 回落首个可见题', () => {
    const visible = [q('q1'), q('q2')];
    const answers: Answers = { q1: 'x', q2: 'y' };
    expect(initialCursorId(visible, answers)).toBe('q1');
  });

  it('可见集为空 → null(兜底不崩)', () => {
    expect(initialCursorId([], {})).toBeNull();
  });
});
