/**
 * 矩阵单选 handler 单测:validate 与 normalize。
 * 矩阵是题型模型的试金石——重点验证「每子行一行」的规范化与子行级校验。
 */
import { describe, expect, it } from 'vitest';
import type { Question } from '@xingjuan/engine';
import { matrixSingleHandler } from '../handler.js';

const baseProps = {
  rows: [
    { id: 'ease', label: '易用性' },
    { id: 'stability', label: '稳定性' },
  ],
  options: [
    { value: 'bad', label: '差' },
    { value: 'good', label: '好' },
  ],
};

const makeQ = (overrides: Partial<Question> = {}): Question => ({
  id: 'q3',
  type: 'matrix-single',
  title: '各项评价',
  props: baseProps,
  ...overrides,
});

describe('matrixSingleHandler.normalize', () => {
  it('每个已答子行产出一行 { qid, subId, value }', () => {
    const rows = matrixSingleHandler.normalize(makeQ(), { ease: 'good', stability: 'bad' });
    expect(rows).toEqual([
      { qid: 'q3', subId: 'ease', value: 'good' },
      { qid: 'q3', subId: 'stability', value: 'bad' },
    ]);
  });

  it('未答子行不产出行', () => {
    const rows = matrixSingleHandler.normalize(makeQ(), { ease: 'good' });
    expect(rows).toEqual([{ qid: 'q3', subId: 'ease', value: 'good' }]);
  });

  it('非对象答案视作空,产出空数组', () => {
    expect(matrixSingleHandler.normalize(makeQ(), 'x')).toEqual([]);
    expect(matrixSingleHandler.normalize(makeQ(), undefined)).toEqual([]);
  });
});

describe('matrixSingleHandler.validate', () => {
  it('合法作答通过', () => {
    expect(matrixSingleHandler.validate(makeQ(), { ease: 'good', stability: 'bad' })).toBeNull();
  });

  it('非法列被拒', () => {
    expect(matrixSingleHandler.validate(makeQ(), { ease: 'nope' })).toBe('所选选项不存在');
  });

  it('不属于本题的子项被拒', () => {
    expect(matrixSingleHandler.validate(makeQ(), { ghost: 'good' })).toBe('存在不属于本题的子项');
  });

  it('必答时缺子行报错', () => {
    expect(matrixSingleHandler.validate(makeQ({ required: true }), { ease: 'good' })).toBe(
      '每个子项都需作答',
    );
  });

  it('必答时全子行作答通过', () => {
    expect(
      matrixSingleHandler.validate(makeQ({ required: true }), { ease: 'good', stability: 'good' }),
    ).toBeNull();
  });
});
