/** 矩阵滑动条 handler 单测:每行数值、范围、必答每行须有值。 */
import { describe, expect, it } from 'vitest';
import type { Question } from '@xingjuan/engine';
import { matrixSliderHandler } from '../handler.js';

const baseProps = {
  rows: [
    { id: 'price', label: '价格' },
    { id: 'quality', label: '质量' },
  ],
  min: 0,
  max: 100,
  step: 5,
};

const makeQ = (overrides: Partial<Question> = {}): Question => ({
  id: 'q5',
  type: 'matrix-slider',
  title: '关注度分配',
  props: baseProps,
  ...overrides,
});

describe('matrixSliderHandler.normalize', () => {
  it('每个已给值子行产出一行(数值)', () => {
    expect(matrixSliderHandler.normalize(makeQ(), { price: 60, quality: 80 })).toEqual([
      { qid: 'q5', subId: 'price', value: 60 },
      { qid: 'q5', subId: 'quality', value: 80 },
    ]);
  });

  it('未给值的行(无键)不产出行', () => {
    expect(matrixSliderHandler.normalize(makeQ(), { price: 60 })).toEqual([
      { qid: 'q5', subId: 'price', value: 60 },
    ]);
  });
});

describe('matrixSliderHandler.validate', () => {
  it('合法作答通过', () => {
    expect(matrixSliderHandler.validate(makeQ(), { price: 60, quality: 80 })).toBeNull();
  });

  it('非数值被拒', () => {
    expect(matrixSliderHandler.validate(makeQ(), { price: 'x' })).toBe('答案应为数值');
  });

  it('越界被拒', () => {
    expect(matrixSliderHandler.validate(makeQ(), { price: 200 })).toBe('数值应在 0 到 100 之间');
  });

  it('不属于本题的子项被拒', () => {
    expect(matrixSliderHandler.validate(makeQ(), { ghost: 10 })).toBe('存在不属于本题的子项');
  });

  it('必答时缺行(未拖动)报错', () => {
    expect(matrixSliderHandler.validate(makeQ({ required: true }), { price: 60 })).toBe(
      '每个子项都需作答',
    );
  });
});
