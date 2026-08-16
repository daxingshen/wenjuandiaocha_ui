/** 多选 handler 单测:validate(数组/合法项/去重/min-max/必答空数组)与 normalize(每选项一行)。 */
import { describe, expect, it } from 'vitest';
import type { Question } from '@xingjuan/engine';
import { multiChoiceHandler } from '../handler.js';

const makeQ = (overrides: Partial<Question> = {}): Question => ({
  id: 'q1',
  type: 'multi-choice',
  title: '多选',
  props: {
    options: [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
      { value: 'c', label: 'C' },
    ],
  },
  ...overrides,
});

describe('multiChoiceHandler.normalize', () => {
  it('每个选中项产出一行', () => {
    expect(multiChoiceHandler.normalize(makeQ(), ['a', 'c'])).toEqual([
      { qid: 'q1', value: 'a' },
      { qid: 'q1', value: 'c' },
    ]);
  });

  it('非数组答案产出空数组', () => {
    expect(multiChoiceHandler.normalize(makeQ(), 'a')).toEqual([]);
  });

  it('混合数组:填空项额外产 subId=<optValue>.fill 行', () => {
    const q = makeQ({
      props: {
        options: [
          { value: 'a', label: 'A' },
          { value: 'other', label: '其他', fill: { enabled: true } },
        ],
      },
    });
    expect(multiChoiceHandler.normalize(q, ['a', { value: 'other', text: '地铁广告' }])).toEqual([
      { qid: 'q1', value: 'a' },
      { qid: 'q1', value: 'other' },
      { qid: 'q1', subId: 'other.fill', value: '地铁广告' },
    ]);
  });

  it('混合数组:填空文本为空不产 fill 行', () => {
    const q = makeQ({
      props: { options: [{ value: 'other', label: '其他', fill: { enabled: true } }] },
    });
    expect(multiChoiceHandler.normalize(q, [{ value: 'other', text: '' }])).toEqual([
      { qid: 'q1', value: 'other' },
    ]);
  });
});

describe('multiChoiceHandler.validate', () => {
  it('合法作答通过', () => {
    expect(multiChoiceHandler.validate(makeQ(), ['a', 'b'])).toBeNull();
  });

  it('非数组被拒', () => {
    expect(multiChoiceHandler.validate(makeQ(), 'a')).toBe('答案格式应为选项数组');
  });

  it('必答时空数组报错(validate.ts 挡不住,须落在 handler)', () => {
    expect(multiChoiceHandler.validate(makeQ({ required: true }), [])).toBe('此题为必答');
  });

  it('包含不存在选项被拒', () => {
    expect(multiChoiceHandler.validate(makeQ(), ['a', 'z'])).toBe('包含不存在的选项');
  });

  it('重复选项被拒', () => {
    expect(multiChoiceHandler.validate(makeQ(), ['a', 'a'])).toBe('选项不可重复');
  });

  it('少于 min 被拒', () => {
    expect(multiChoiceHandler.validate(makeQ({ props: { options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }], min: 2 } }), ['a'])).toBe(
      '至少选择 2 项',
    );
  });

  it('多于 max 被拒', () => {
    expect(multiChoiceHandler.validate(makeQ({ props: { options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }, { value: 'c', label: 'C' }], max: 2 } }), ['a', 'b', 'c'])).toBe(
      '最多选择 2 项',
    );
  });

  it('混合数组:合法(裸 string + 填空对象)通过', () => {
    const q = makeQ({
      props: {
        options: [
          { value: 'a', label: 'A' },
          { value: 'other', label: '其他', fill: { enabled: true } },
        ],
      },
    });
    expect(multiChoiceHandler.validate(q, ['a', { value: 'other', text: '地铁' }])).toBeNull();
  });

  it('填空必填但文本空 → 报错', () => {
    const q = makeQ({
      props: { options: [{ value: 'other', label: '其他', fill: { enabled: true, required: true } }] },
    });
    expect(multiChoiceHandler.validate(q, [{ value: 'other', text: '  ' }])).toBe('请填写补充内容');
  });

  it('混合数组:对象与裸 string 指向同一 value 视为重复', () => {
    const q = makeQ({
      props: { options: [{ value: 'other', label: '其他', fill: { enabled: true } }] },
    });
    expect(multiChoiceHandler.validate(q, ['other', { value: 'other', text: 'x' }])).toBe('选项不可重复');
  });

  it('元素格式非法(数字)被拒', () => {
    expect(multiChoiceHandler.validate(makeQ(), [1, 2] as unknown[])).toBe('包含不存在的选项');
  });
});
