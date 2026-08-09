/**
 * T1 完成判据:derivePreview 的逻辑显隐 + 完成度口径。
 * 用 runtime demo 同款规则(q1=no → hide q2)构造带规则 schema,验证隐藏题不计入必答总数。
 */
import { describe, it, expect } from 'vitest';
import { derivePreview } from './derive.js';
import type { SurveySchema } from '@xingjuan/engine';

const schemaWithRule: SurveySchema = {
  id: 't',
  type: 'survey',
  title: 't',
  version: 1,
  questions: [
    { id: 'q1', type: 'single-choice', title: '用过吗', required: true, props: { options: [{ value: 'yes', label: '用过' }, { value: 'no', label: '没用过' }] } },
    { id: 'q2', type: 'scale', title: '满意度', required: true, props: { min: 1, max: 5 } },
  ],
  rules: [
    { id: 'r1', conditions: [{ qid: 'q1', op: 'eq', value: 'no' }], combinator: 'AND', action: { type: 'hide', target: 'q2' } },
  ],
};

describe('derivePreview · 逻辑显隐与完成度', () => {
  it('q1=no → q2 被隐藏、不计入可见/必答总数', () => {
    const d = derivePreview(schemaWithRule, { q1: 'no' });
    expect(d.hidden.has('q2')).toBe(true);
    expect(d.visible.map((q) => q.id)).toEqual(['q1']);
    expect(d.requiredTotal).toBe(1); // 仅 q1
    expect(d.answeredCount).toBe(1); // q1 已答
    expect(d.pct).toBe(100);
    // 检查器清单仍列出 q2,标记为隐藏
    expect(d.items.find((it) => it.q.id === 'q2')?.isHidden).toBe(true);
  });

  it('q1=yes → q2 可见并计入必答总数', () => {
    const d = derivePreview(schemaWithRule, { q1: 'yes' });
    expect(d.hidden.has('q2')).toBe(false);
    expect(d.visible.map((q) => q.id)).toEqual(['q1', 'q2']);
    expect(d.requiredTotal).toBe(2);
    expect(d.answeredCount).toBe(1); // q2 未答
    expect(d.pct).toBe(50);
  });

  it('空答案:无 empty 类规则则全可见,q1 未答', () => {
    const d = derivePreview(schemaWithRule, {});
    expect(d.hidden.size).toBe(0);
    expect(d.requiredTotal).toBe(2);
    expect(d.answeredCount).toBe(0);
    expect(d.pct).toBe(0);
  });

  it('无必答题时 pct=100', () => {
    const s: SurveySchema = { ...schemaWithRule, questions: [{ id: 'x', type: 'textarea', title: '选填', props: {} }], rules: [] };
    const d = derivePreview(s, {});
    expect(d.requiredTotal).toBe(0);
    expect(d.pct).toBe(100);
  });

  it('已答判定:空串视作未答', () => {
    const d = derivePreview(schemaWithRule, { q1: '', q2: 3 });
    expect(d.items.find((it) => it.q.id === 'q1')?.isAnswered).toBe(false);
  });
});
