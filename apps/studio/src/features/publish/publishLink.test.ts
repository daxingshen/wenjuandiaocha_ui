import { describe, it, expect } from 'vitest';
import { answerLink } from './publishLink.js';

describe('answerLink', () => {
  it('用显式 runtimeBase 拼 hash 路由', () => {
    expect(answerLink('abc', 'http://localhost:5174')).toBe('http://localhost:5174/#/s/abc');
  });

  it('runtimeBase 缺失时回落 origin', () => {
    expect(answerLink('abc', undefined, 'https://xj.cn')).toBe('https://xj.cn/#/s/abc');
  });

  it('runtimeBase 优先于 origin', () => {
    expect(answerLink('x1', 'https://ans.xj.cn', 'https://studio.xj.cn')).toBe('https://ans.xj.cn/#/s/x1');
  });

  it('去掉 base 末尾斜杠,避免双斜杠', () => {
    expect(answerLink('abc', 'https://xj.cn/')).toBe('https://xj.cn/#/s/abc');
  });

  it('base 全空时产出相对 hash 链接', () => {
    expect(answerLink('abc', '', '')).toBe('/#/s/abc');
  });
});
