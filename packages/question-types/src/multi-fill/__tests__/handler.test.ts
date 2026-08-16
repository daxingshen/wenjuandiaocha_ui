/** 多项填空 handler 单测:每框校验、必答每框非空、normalize、越界框、旧问卷兼容。 */
import { describe, expect, it } from 'vitest';
import type { Question } from '@xingjuan/engine';
import { multiFillHandler } from '../handler.js';

const makeQ = (props: Record<string, unknown>, required = false): Question => ({
  id: 'q1',
  type: 'multi-fill',
  title: '收货信息',
  required,
  props,
});

const blanks = [
  { id: 'b1', label: '收货人' },
  { id: 'b2', label: '手机号', format: 'phone' as const },
  { id: 'b3', label: '省份', format: 'province' as const },
];

describe('multiFillHandler.validate', () => {
  it('每框独立 format 校验', () => {
    expect(multiFillHandler.validate(makeQ({ blanks }), { b2: '13800138000' })).toBeNull();
    expect(multiFillHandler.validate(makeQ({ blanks }), { b2: '123' })).toBe('手机号格式不正确');
    expect(multiFillHandler.validate(makeQ({ blanks }), { b3: '广东省' })).toBeNull();
    expect(multiFillHandler.validate(makeQ({ blanks }), { b3: '火星省' })).toBe('请选择省份');
  });

  it('必答时每框都需非空', () => {
    expect(multiFillHandler.validate(makeQ({ blanks }, true), { b1: '张三', b2: '13800138000', b3: '广东省' })).toBeNull();
    expect(multiFillHandler.validate(makeQ({ blanks }, true), { b1: '张三', b2: '13800138000' })).toBe('每个填空框都需作答');
  });

  it('空对象在必答下被拦(不绕过)', () => {
    expect(multiFillHandler.validate(makeQ({ blanks }, true), {})).toBe('每个填空框都需作答');
  });

  it('非必答时留空豁免', () => {
    expect(multiFillHandler.validate(makeQ({ blanks }), {})).toBeNull();
  });

  it('不属于本题的框被拒', () => {
    expect(multiFillHandler.validate(makeQ({ blanks }), { bx: '异常' })).toBe('存在不属于本题的填空框');
  });

  it('每框独立字数范围', () => {
    const b = [{ id: 'b1', minLength: 3, maxLength: 5 }];
    expect(multiFillHandler.validate(makeQ({ blanks: b }), { b1: 'ab' })).toBe('至少 3 个字符');
    expect(multiFillHandler.validate(makeQ({ blanks: b }), { b1: 'abcdef' })).toBe('不超过 5 个字符');
    expect(multiFillHandler.validate(makeQ({ blanks: b }), { b1: 'abcd' })).toBeNull();
  });
});

describe('multiFillHandler.normalize', () => {
  it('每已答框一行(subId=blankId),按 blanks 顺序', () => {
    expect(multiFillHandler.normalize(makeQ({ blanks }), { b3: '广东省', b1: '张三' })).toEqual([
      { qid: 'q1', subId: 'b1', value: '张三' },
      { qid: 'q1', subId: 'b3', value: '广东省' },
    ]);
  });

  it('空框不产行', () => {
    expect(multiFillHandler.normalize(makeQ({ blanks }), { b1: '', b2: '13800138000' })).toEqual([
      { qid: 'q1', subId: 'b2', value: '13800138000' },
    ]);
  });
});

describe('multiFillHandler.logicRef', () => {
  it('暴露每框为子条件源', () => {
    expect(multiFillHandler.logicRef?.(makeQ({ blanks }))).toEqual({
      subFields: [
        { id: 'b1', label: '收货人' },
        { id: 'b2', label: '手机号' },
        { id: 'b3', label: '省份' },
      ],
    });
  });
});

describe('multiFillHandler 兼容', () => {
  it('无 blanks(异常 props)不崩', () => {
    expect(multiFillHandler.validate(makeQ({}), {})).toBeNull();
    expect(multiFillHandler.normalize(makeQ({}), {})).toEqual([]);
  });

  it('defaultProps 给两个默认框', () => {
    const dp = multiFillHandler.defaultProps() as { blanks: unknown[] };
    expect(dp.blanks).toHaveLength(2);
  });
});
