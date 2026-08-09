/**
 * 逻辑求值器单测:聚焦「标量题带元数据的对象形答案」的通用「取 value」钻取(T1)。
 * 契约级跨语言一致性由 golden.test.ts + golden-vectors.json 锁;此处补前端侧边界。
 */
import { describe, it, expect } from 'vitest';
import { evalCondition } from '../logic.js';
import type { Condition, Answers } from '../schema.js';

describe('evalCondition · 对象形标量答案的 value 钻取', () => {
  const eqOther: Condition = { qid: 'q1', op: 'eq', value: 'other' };

  it('对象形 {value,text} 的 eq 命中,与裸 string 等价', () => {
    const obj: Answers = { q1: { value: 'other', text: '具体用途' } };
    const str: Answers = { q1: 'other' };
    expect(evalCondition(eqOther, obj)).toBe(true);
    expect(evalCondition(eqOther, str)).toBe(true);
  });

  it('对象形 value 不匹配 → eq 不命中', () => {
    const obj: Answers = { q1: { value: 'work', text: '' } };
    expect(evalCondition(eqOther, obj)).toBe(false);
  });

  it('ne 对对象形按 value 比较', () => {
    const ne: Condition = { qid: 'q1', op: 'ne', value: 'other' };
    expect(evalCondition(ne, { q1: { value: 'work', text: '' } })).toBe(true);
    expect(evalCondition(ne, { q1: { value: 'other', text: 'x' } })).toBe(false);
  });

  it('answered:对象形 value 为空串 → 未作答', () => {
    const answered: Condition = { qid: 'q1', op: 'answered', value: null };
    expect(evalCondition(answered, { q1: { value: '', text: '' } })).toBe(false);
    expect(evalCondition(answered, { q1: { value: 'other', text: '' } })).toBe(true);
  });

  it('不破矩阵子行:无 value 字段的对象(矩阵行)不被误钻取', () => {
    // 矩阵整题引用(无 subId)时,answer 是 { 子行id: value },无自有 value 字段 → 不钻取
    const matrixWhole: Condition = { qid: 'q3', op: 'answered', value: null };
    expect(evalCondition(matrixWhole, { q3: { ease: 'bad', stability: 'good' } })).toBe(true);
    // 有 subId 时仍走矩阵钻取,不受影响
    const matrixRow: Condition = { qid: 'q3', subId: 'ease', op: 'eq', value: 'bad' };
    expect(evalCondition(matrixRow, { q3: { ease: 'bad', stability: 'good' } })).toBe(true);
  });

  it('不破裸数组(多选)includes', () => {
    const inc: Condition = { qid: 'q1', op: 'includes', value: 'b' };
    expect(evalCondition(inc, { q1: ['a', 'b'] })).toBe(true);
  });
});
