/**
 * 作答路径栏派生逻辑单测(纯函数,零 DOM)。锁死 §4.5 时间线语义:
 * 隐藏题标 skip 且带「因 Qx」源题序号;可见题按 done/miss/cur/中性 分档;
 * miss 仅在提交尝试后(tried)对必答未答题亮。
 */
import { describe, it, expect } from 'vitest';
import type { SurveySchema } from '@xingjuan/engine';
import { evaluate } from '@xingjuan/engine';
import { buildPath } from './fillPath.js';

// q1 单选;q1='no' 隐藏 q2(scale,必答);q3 选填文本。
const schema: SurveySchema = {
  id: 's', type: 'survey', title: 'T', version: 1,
  questions: [
    { id: 'q1', type: 'single-choice', title: '用过吗', required: true, props: {} },
    { id: 'q2', type: 'scale', title: '满意度', required: true, props: {} },
    { id: 'q3', type: 'text-input', title: '建议', props: {} },
  ],
  rules: [
    { id: 'r1', conditions: [{ qid: 'q1', op: 'eq', value: 'no' }], combinator: 'AND', action: { type: 'hide', target: 'q2' } },
  ],
};

const path = (answers: Record<string, unknown>, tried = false) =>
  buildPath(schema, answers, evaluate(schema.rules, answers).hidden, tried);

describe('buildPath', () => {
  it('空答:首个可见题为 cur,其余可见未答为中性', () => {
    const p = path({});
    expect(p.map((n) => n.status)).toEqual(['cur', '', '']);
    expect(p.map((n) => n.no)).toEqual([1, 2, 3]);
  });

  it('已答题标 done,下一未答可见题成为 cur', () => {
    const p = path({ q1: 'yes' });
    expect(p.find((n) => n.qid === 'q1')!.status).toBe('done');
    expect(p.find((n) => n.qid === 'q2')!.status).toBe('cur');
  });

  it('逻辑隐藏的题标 skip 并带源题序号(因 Q1)', () => {
    const p = path({ q1: 'no' });
    const q2 = p.find((n) => n.qid === 'q2')!;
    expect(q2.status).toBe('skip');
    expect(q2.srcNo).toBe(1); // Q1 触发隐藏
  });

  it('提交尝试后,可见的必答未答题标 miss;选填题不标 miss', () => {
    const p = path({ q1: 'yes' }, true); // q2 可见必答未答 → miss;q3 选填 → 中性
    expect(p.find((n) => n.qid === 'q2')!.status).toBe('miss');
    expect(p.find((n) => n.qid === 'q3')!.status).toBe('');
  });

  it('被跳过的必答题即便 tried 也保持 skip,不误报 miss', () => {
    const p = path({ q1: 'no' }, true);
    expect(p.find((n) => n.qid === 'q2')!.status).toBe('skip');
  });
});
