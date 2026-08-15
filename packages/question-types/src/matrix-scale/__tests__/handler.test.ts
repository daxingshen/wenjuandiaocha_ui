/** 矩阵量表 handler 单测:行为与矩阵单选同构(每行选一列值)。 */
import { describe, expect, it } from 'vitest';
import type { Question } from '@xingjuan/engine';
import { matrixScaleHandler } from '../handler.js';

const baseProps = {
  rows: [
    { id: 'quality', label: '产品质量' },
    { id: 'price', label: '性价比' },
  ],
  options: [
    { value: 's1', label: '很不满意', score: 1 },
    { value: 's2', label: '不满意', score: 2 },
    { value: 's3', label: '一般', score: 3 },
    { value: 's4', label: '满意', score: 4 },
    { value: 's5', label: '很满意', score: 5 },
  ],
  level: 5,
};

const makeQ = (overrides: Partial<Question> = {}): Question => ({
  id: 'q3',
  type: 'matrix-scale',
  title: '各维度打分',
  props: baseProps,
  ...overrides,
});

describe('matrixScaleHandler.normalize', () => {
  it('每个已答子行产出一行,value 为该列分值(number)', () => {
    expect(matrixScaleHandler.normalize(makeQ(), { quality: 's4', price: 's3' })).toEqual([
      { qid: 'q3', subId: 'quality', value: 4 },
      { qid: 'q3', subId: 'price', value: 3 },
    ]);
  });

  it('列无分值时回落列 value 字符串', () => {
    const q = makeQ({ props: { rows: [{ id: 'a', label: 'A' }], options: [{ value: 'x', label: 'X' }] } });
    expect(matrixScaleHandler.normalize(q, { a: 'x' })).toEqual([{ qid: 'q3', subId: 'a', value: 'x' }]);
  });
});

describe('matrixScaleHandler.validate', () => {
  it('合法作答通过', () => {
    expect(matrixScaleHandler.validate(makeQ(), { quality: 's4', price: 's3' })).toBeNull();
  });

  it('非法量级值被拒', () => {
    expect(matrixScaleHandler.validate(makeQ(), { quality: 's9' })).toBe('所选选项不存在');
  });

  it('必答时缺子行报错', () => {
    expect(matrixScaleHandler.validate(makeQ({ required: true }), { quality: 's4' })).toBe(
      '每个子项都需作答',
    );
  });
});
