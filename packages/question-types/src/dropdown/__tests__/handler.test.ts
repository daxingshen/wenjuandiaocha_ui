/** 下拉框 handler 单测:validate(格式/存在/空串放行)与 normalize(选中一行)。 */
import { describe, expect, it } from 'vitest';
import type { Question } from '@xingjuan/engine';
import { dropdownHandler } from '../handler.js';

const makeQ = (overrides: Partial<Question> = {}): Question => ({
  id: 'q1',
  type: 'dropdown',
  title: '下拉框',
  props: {
    options: [
      { value: 'bj', label: '北京' },
      { value: 'sh', label: '上海' },
    ],
    defaultValue: 'sh',
  },
  ...overrides,
});

describe('dropdownHandler.validate', () => {
  it('存在的选项通过', () => {
    expect(dropdownHandler.validate(makeQ(), 'sh')).toBeNull();
  });

  it('不存在的选项被拒', () => {
    expect(dropdownHandler.validate(makeQ(), 'gz')).toBe('所选选项不存在');
  });

  it('空串放行(必答判定交通用层)', () => {
    expect(dropdownHandler.validate(makeQ(), '')).toBeNull();
  });

  it('非字符串被拒', () => {
    expect(dropdownHandler.validate(makeQ(), ['sh'])).toBe('答案格式应为单个选项');
  });
});

describe('dropdownHandler.normalize', () => {
  it('选中项产出一行', () => {
    expect(dropdownHandler.normalize(makeQ(), 'sh')).toEqual([{ qid: 'q1', value: 'sh' }]);
  });

  it('空串产出空数组', () => {
    expect(dropdownHandler.normalize(makeQ(), '')).toEqual([]);
  });
});

describe('dropdownHandler.logicRef', () => {
  it('选项作为条件值候选', () => {
    expect(dropdownHandler.logicRef?.(makeQ())).toEqual({
      values: [
        { value: 'bj', label: '北京' },
        { value: 'sh', label: '上海' },
      ],
    });
  });
});
