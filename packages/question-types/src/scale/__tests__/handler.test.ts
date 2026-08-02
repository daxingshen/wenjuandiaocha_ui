/** 量表 handler 单测:validate(整数/范围)与 normalize(数字一行)。 */
import { describe, expect, it } from 'vitest';
import type { Question } from '@xingjuan/engine';
import { scaleHandler } from '../handler.js';

const makeQ = (overrides: Partial<Question> = {}): Question => ({
  id: 'q2',
  type: 'scale',
  title: '满意度',
  props: { min: 1, max: 5 },
  ...overrides,
});

describe('scaleHandler.normalize', () => {
  it('产出一行,value 为数字', () => {
    expect(scaleHandler.normalize(makeQ(), 4)).toEqual([{ qid: 'q2', value: 4 }]);
  });

  it('非数字产出空数组', () => {
    expect(scaleHandler.normalize(makeQ(), '4')).toEqual([]);
  });
});

describe('scaleHandler.validate', () => {
  it('范围内整数通过', () => {
    expect(scaleHandler.validate(makeQ(), 3)).toBeNull();
  });

  it('非整数被拒', () => {
    expect(scaleHandler.validate(makeQ(), 3.5)).toBe('答案应为整数刻度值');
  });

  it('超范围被拒', () => {
    expect(scaleHandler.validate(makeQ(), 6)).toBe('刻度值应在 1 到 5 之间');
  });
});
