/** 矩阵多选 handler 单测:validate 与 normalize。重点:每行 min/max、每行逐项一行。 */
import { describe, expect, it } from 'vitest';
import type { Question } from '@xingjuan/engine';
import { matrixMultiHandler } from '../handler.js';

const baseProps = {
  rows: [
    { id: 'app', label: 'App' },
    { id: 'web', label: '网页' },
  ],
  options: [
    { value: 'buy', label: '下单' },
    { value: 'refund', label: '退款' },
    { value: 'chat', label: '客服' },
  ],
  min: 1,
  max: 2,
};

const makeQ = (overrides: Partial<Question> = {}): Question => ({
  id: 'q2',
  type: 'matrix-multi',
  title: '各渠道用过哪些功能',
  props: baseProps,
  ...overrides,
});

describe('matrixMultiHandler.normalize', () => {
  it('每行的每个选中项产出一行', () => {
    const rows = matrixMultiHandler.normalize(makeQ(), { app: ['buy', 'chat'], web: ['refund'] });
    expect(rows).toEqual([
      { qid: 'q2', subId: 'app', value: 'buy' },
      { qid: 'q2', subId: 'app', value: 'chat' },
      { qid: 'q2', subId: 'web', value: 'refund' },
    ]);
  });

  it('空数组/未答行不产出行', () => {
    expect(matrixMultiHandler.normalize(makeQ(), { app: [], web: ['buy'] })).toEqual([
      { qid: 'q2', subId: 'web', value: 'buy' },
    ]);
  });

  it('非对象答案产出空数组', () => {
    expect(matrixMultiHandler.normalize(makeQ(), 'x')).toEqual([]);
  });
});

describe('matrixMultiHandler.validate', () => {
  it('合法作答通过', () => {
    expect(matrixMultiHandler.validate(makeQ(), { app: ['buy'], web: ['refund', 'chat'] })).toBeNull();
  });

  it('非数组行值被拒', () => {
    expect(matrixMultiHandler.validate(makeQ(), { app: 'buy' })).toBe('答案格式应为选项数组');
  });

  it('非法列被拒', () => {
    expect(matrixMultiHandler.validate(makeQ(), { app: ['nope'] })).toBe('包含不存在的选项');
  });

  it('不属于本题的子项被拒', () => {
    expect(matrixMultiHandler.validate(makeQ(), { ghost: ['buy'] })).toBe('存在不属于本题的子项');
  });

  it('重复选项被拒', () => {
    expect(matrixMultiHandler.validate(makeQ(), { app: ['buy', 'buy'] })).toBe('选项不可重复');
  });

  it('超过每行 max 被拒', () => {
    expect(matrixMultiHandler.validate(makeQ(), { app: ['buy', 'refund', 'chat'] })).toBe(
      '每行最多选择 2 项',
    );
  });

  it('非必答时空行跳过 min 校验', () => {
    expect(matrixMultiHandler.validate(makeQ(), { app: ['buy'] })).toBeNull();
  });

  it('必答时缺子行报错', () => {
    expect(matrixMultiHandler.validate(makeQ({ required: true }), { app: ['buy'] })).toBe(
      '每个子项都需作答',
    );
  });

  it('必答时全行满足 min 通过', () => {
    expect(
      matrixMultiHandler.validate(makeQ({ required: true }), { app: ['buy'], web: ['refund'] }),
    ).toBeNull();
  });
});
