/** 单项填空 handler 单测:validate(格式 email/phone、maxLength)与 normalize。 */
import { describe, expect, it } from 'vitest';
import type { Question } from '@xingjuan/engine';
import { textInputHandler } from '../handler.js';

const makeQ = (props: Record<string, unknown> = {}): Question => ({
  id: 'q1',
  type: 'text-input',
  title: '填空',
  props,
});

describe('textInputHandler.normalize', () => {
  it('非空文本产出一行', () => {
    expect(textInputHandler.normalize(makeQ(), '你好')).toEqual([{ qid: 'q1', value: '你好' }]);
  });

  it('空串产出空数组', () => {
    expect(textInputHandler.normalize(makeQ(), '')).toEqual([]);
  });
});

describe('textInputHandler.validate', () => {
  it('text 格式任意文本通过', () => {
    expect(textInputHandler.validate(makeQ(), 'anything')).toBeNull();
  });

  it('email 合法通过、非法被拒', () => {
    expect(textInputHandler.validate(makeQ({ format: 'email' }), 'a@b.com')).toBeNull();
    expect(textInputHandler.validate(makeQ({ format: 'email' }), 'nope')).toBe('邮箱格式不正确');
  });

  it('phone 合法通过、非法被拒', () => {
    expect(textInputHandler.validate(makeQ({ format: 'phone' }), '13800138000')).toBeNull();
    expect(textInputHandler.validate(makeQ({ format: 'phone' }), '123')).toBe('手机号格式不正确');
  });

  it('超长被拒', () => {
    expect(textInputHandler.validate(makeQ({ maxLength: 3 }), 'abcd')).toBe('不超过 3 个字符');
  });

  it('过短被拒', () => {
    expect(textInputHandler.validate(makeQ({ minLength: 3 }), 'ab')).toBe('至少 3 个字符');
  });

  it('扩展 format:integer/date/province', () => {
    expect(textInputHandler.validate(makeQ({ format: 'integer' }), '42')).toBeNull();
    expect(textInputHandler.validate(makeQ({ format: 'integer' }), '4.2')).toBe('请填写整数');
    expect(textInputHandler.validate(makeQ({ format: 'date' }), '2026-02-30')).toBe('日期格式应为 YYYY-MM-DD');
    expect(textInputHandler.validate(makeQ({ format: 'province' }), '广东省')).toBeNull();
    expect(textInputHandler.validate(makeQ({ format: 'province' }), '火星省')).toBe('请选择省份');
  });

  it('缺省字段(旧问卷)照常通过', () => {
    expect(textInputHandler.validate(makeQ(), '任意文本')).toBeNull();
  });
});
