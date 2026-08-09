/** 单选 handler 单测:validate/normalize 兼容裸 string 与对象形 { value, text }(带填空)。 */
import { describe, expect, it } from 'vitest';
import type { Question } from '@xingjuan/engine';
import { singleChoiceHandler } from '../handler.js';

const makeQ = (overrides: Partial<Question> = {}): Question => ({
  id: 'q1',
  type: 'single-choice',
  title: '单选',
  props: {
    options: [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
      { value: 'other', label: '其他', fill: { enabled: true, required: true } },
    ],
  },
  ...overrides,
});

describe('singleChoiceHandler.validate', () => {
  it('合法裸 string 选项通过', () => {
    expect(singleChoiceHandler.validate(makeQ(), 'a')).toBeNull();
  });

  it('非 string 非对象被拒', () => {
    expect(singleChoiceHandler.validate(makeQ(), 123)).toBe('答案格式应为单个选项');
    expect(singleChoiceHandler.validate(makeQ(), ['a'])).toBe('答案格式应为单个选项');
  });

  it('不存在的选项被拒', () => {
    expect(singleChoiceHandler.validate(makeQ(), 'z')).toBe('所选选项不存在');
    expect(singleChoiceHandler.validate(makeQ(), { value: 'z', text: 'x' })).toBe('所选选项不存在');
  });

  it('对象形 { value, text } 合法通过', () => {
    expect(singleChoiceHandler.validate(makeQ(), { value: 'other', text: '具体用途' })).toBeNull();
  });

  it('fill.required 且文本为空被拒', () => {
    expect(singleChoiceHandler.validate(makeQ(), { value: 'other', text: '' })).toBe('请填写补充内容');
    expect(singleChoiceHandler.validate(makeQ(), { value: 'other', text: '  ' })).toBe('请填写补充内容');
    // 裸 string 选中 other(未带文本)也应报填空必填
    expect(singleChoiceHandler.validate(makeQ(), 'other')).toBe('请填写补充内容');
  });

  it('fill 非必填时文本可空', () => {
    const q = makeQ({
      props: {
        options: [
          { value: 'a', label: 'A' },
          { value: 'other', label: '其他', fill: { enabled: true, required: false } },
        ],
      },
    });
    expect(singleChoiceHandler.validate(q, { value: 'other', text: '' })).toBeNull();
    expect(singleChoiceHandler.validate(q, 'other')).toBeNull();
  });
});

describe('singleChoiceHandler.normalize', () => {
  it('裸 string 产一行', () => {
    expect(singleChoiceHandler.normalize(makeQ(), 'a')).toEqual([{ qid: 'q1', value: 'a' }]);
  });

  it('空答案不产行', () => {
    expect(singleChoiceHandler.normalize(makeQ(), '')).toEqual([]);
    expect(singleChoiceHandler.normalize(makeQ(), 123)).toEqual([]);
  });

  it('对象形带非空文本产两行(value + fill 子行)', () => {
    expect(singleChoiceHandler.normalize(makeQ(), { value: 'other', text: '具体用途' })).toEqual([
      { qid: 'q1', value: 'other' },
      { qid: 'q1', subId: 'fill', value: '具体用途' },
    ]);
  });

  it('对象形文本为空只产 value 一行', () => {
    expect(singleChoiceHandler.normalize(makeQ(), { value: 'other', text: '' })).toEqual([
      { qid: 'q1', value: 'other' },
    ]);
  });
});
