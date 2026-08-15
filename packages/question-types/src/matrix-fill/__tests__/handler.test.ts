/** 矩阵填空 handler 单测:每行文本、maxLength、必答每行非空。 */
import { describe, expect, it } from 'vitest';
import type { Question } from '@xingjuan/engine';
import { matrixFillHandler } from '../handler.js';

const baseProps = {
  rows: [
    { id: 'phone', label: '手机号' },
    { id: 'email', label: '邮箱' },
  ],
  maxLength: 20,
};

const makeQ = (overrides: Partial<Question> = {}): Question => ({
  id: 'q4',
  type: 'matrix-fill',
  title: '各项联系方式',
  props: baseProps,
  ...overrides,
});

describe('matrixFillHandler.normalize', () => {
  it('每个已填子行产出一行', () => {
    expect(matrixFillHandler.normalize(makeQ(), { phone: '13800000000', email: '' })).toEqual([
      { qid: 'q4', subId: 'phone', value: '13800000000' },
    ]);
  });
});

describe('matrixFillHandler.validate', () => {
  it('合法作答通过', () => {
    expect(matrixFillHandler.validate(makeQ(), { phone: '138', email: 'a@b.c' })).toBeNull();
  });

  it('超长被拒', () => {
    expect(matrixFillHandler.validate(makeQ(), { phone: '123456789012345678901' })).toBe(
      '每行不超过 20 个字符',
    );
  });

  it('不属于本题的子项被拒', () => {
    expect(matrixFillHandler.validate(makeQ(), { ghost: 'x' })).toBe('存在不属于本题的子项');
  });

  it('必答时缺子行报错', () => {
    expect(matrixFillHandler.validate(makeQ({ required: true }), { phone: '138' })).toBe(
      '每个子项都需作答',
    );
  });
});
