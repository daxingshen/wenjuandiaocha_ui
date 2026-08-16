/** 共享文本校验单测:11 项 format 合法/非法 + 长度顺序 + 省份名单。 */
import { describe, expect, it } from 'vitest';
import { validateTextValue, normalizeFormat } from '../text-format.js';
import { PROVINCES, PROVINCE_SET } from '../provinces.js';

describe('validateTextValue · 11 项 format', () => {
  const cases: Array<[string, string, boolean]> = [
    // [format, value, 期望通过]
    ['text', '随便什么', true],
    ['email', 'a@b.com', true],
    ['email', 'nope', false],
    ['phone', '13800138000', true],
    ['phone', '123', false],
    ['integer', '-42', true],
    ['integer', '4.2', false],
    ['decimal', '-3.14', true],
    ['decimal', '3.', false],
    ['date', '2026-02-28', true],
    ['date', '2026-02-30', false], // 合法日历日校验
    ['date', '2026-2-8', false], // 格式
    ['age', '0', true],
    ['age', '150', true],
    ['age', '151', false],
    ['age', '-1', false],
    ['province', '广东省', true],
    ['province', '火星省', false],
    ['idcard', '110101199003076173', true], // 合成号,校验码 3 正确(加权和 218 % 11 = 9 → '3')
    ['idcard', '110101199003076170', false], // 校验码错
    ['zipcode', '100000', true],
    ['zipcode', '1000', false],
    ['url', 'https://example.com/x', true],
    ['url', 'example.com', false],
  ];
  for (const [format, value, ok] of cases) {
    it(`${format} / ${JSON.stringify(value)} → ${ok ? '通过' : '拒绝'}`, () => {
      const r = validateTextValue(value, { format: format as never });
      if (ok) expect(r).toBeNull();
      else expect(r).not.toBeNull();
    });
  }
});

describe('validateTextValue · 长度与顺序', () => {
  it('超长优先于 format(先报超长)', () => {
    expect(validateTextValue('abcd', { format: 'email', maxLength: 3 })).toBe('不超过 3 个字符');
  });
  it('过短报至少', () => {
    expect(validateTextValue('ab', { minLength: 3 })).toBe('至少 3 个字符');
  });
  it('长度合规再校 format', () => {
    expect(validateTextValue('nope', { format: 'email', minLength: 1, maxLength: 100 })).toBe('邮箱格式不正确');
  });
  it('非字符串被拒', () => {
    expect(validateTextValue(42, {})).toBe('答案格式应为文本');
  });
});

describe('normalizeFormat', () => {
  it('非法值回落 text', () => {
    expect(normalizeFormat('bogus')).toBe('text');
    expect(normalizeFormat(undefined)).toBe('text');
    expect(normalizeFormat('phone')).toBe('phone');
  });
});

describe('省份名单', () => {
  it('34 个省级行政区(哨兵)', () => {
    expect(PROVINCES.length).toBe(34);
    expect(PROVINCE_SET.size).toBe(34);
  });
});
