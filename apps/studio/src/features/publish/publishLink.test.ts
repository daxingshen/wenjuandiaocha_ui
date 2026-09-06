import { describe, it, expect } from 'vitest';
import { answerLink, deriveRuntimeBase } from './publishLink.js';

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

describe('deriveRuntimeBase', () => {
  const loc = { protocol: 'http:', hostname: '192.168.1.7', origin: 'http://192.168.1.7:5173' };

  it('dev 用局域网 IP 访问 → 链接用同一 IP + runtime 端口(不写死 localhost)', () => {
    expect(deriveRuntimeBase({ dev: true, ...loc })).toBe('http://192.168.1.7:5174');
  });

  it('dev 用 localhost 访问 → 链接仍用 localhost + runtime 端口', () => {
    expect(
      deriveRuntimeBase({ dev: true, protocol: 'http:', hostname: 'localhost', origin: 'http://localhost:5173' }),
    ).toBe('http://localhost:5174');
  });

  it('显式 VITE_RUNTIME_BASE 最高优先(逃生口),盖过 dev 推导', () => {
    expect(deriveRuntimeBase({ env: 'https://ans.xj.cn', dev: true, ...loc })).toBe('https://ans.xj.cn');
  });

  it('prod 同源(非 dev、无 env)→ 回落 origin + /f 前缀(runtime 挂 /f,链接不指向根上的 studio)', () => {
    expect(
      deriveRuntimeBase({ dev: false, protocol: 'https:', hostname: 'xj.cn', origin: 'https://xj.cn' }),
    ).toBe('https://xj.cn/f');
  });

  it('prod 同源 + answerLink 端到端 → origin/f/#/s/:id(绝对可分享,运行时解析,不烤入部署域名)', () => {
    const base = deriveRuntimeBase({ dev: false, protocol: 'https:', hostname: 'xj.cn', origin: 'https://xj.cn' });
    expect(answerLink('x1', base)).toBe('https://xj.cn/f/#/s/x1');
  });

  it('保留访问协议(https 局域网也不降级)', () => {
    expect(
      deriveRuntimeBase({ dev: true, protocol: 'https:', hostname: '10.0.0.5', origin: 'https://10.0.0.5:5173' }),
    ).toBe('https://10.0.0.5:5174');
  });
});
