/**
 * auth API 单测(node 环境,stub fetch)。锁死作答端鉴权契约:
 *   - login 成功返回 { id, name, role },带 credentials:'include';账密错(40101)抛 ApiError.unauthorized;
 *   - me() 未登录(40101)抛 ApiError.unauthorized —— useAuth 据此判 anon vs error;
 *   - logout 网络错静默(不抛)。
 * 这几条是 useAuth 状态机(unknown→authed/anon/error)的判定依据,故在此层锁死。
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { login, logout, me } from './auth.js';
import { ApiError, Code } from './client.js';

function envelope(code: number, data: unknown, message = '') {
  return { ok: true, status: 200, json: async () => ({ code, message, data }) };
}

afterEach(() => vi.unstubAllGlobals());

describe('login', () => {
  it('成功返回 { id, name, role } 且带 credentials:include', async () => {
    const spy = vi.fn(async (_url: string, _init?: RequestInit) => envelope(Code.OK, { id: 'u1', name: '小明', role: 'respondent' }));
    vi.stubGlobal('fetch', spy);
    const user = await login('u1', 'pw');
    expect(user).toEqual({ id: 'u1', name: '小明', role: 'respondent' });
    const [url, init] = spy.mock.calls[0]!;
    expect(String(url)).toContain('/auth/login');
    expect(init!.credentials).toBe('include');
  });

  it('账密错(40101)抛 ApiError.unauthorized', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => envelope(Code.Unauthorized, null, '账号或密码错误')));
    try {
      await login('u1', 'bad');
      expect.unreachable('应抛错');
    } catch (e) {
      expect((e as ApiError).unauthorized).toBe(true);
    }
  });
});

describe('me', () => {
  it('已登录返回 user', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => envelope(Code.OK, { id: 'u1', name: 'A', role: 'admin' })));
    expect((await me()).role).toBe('admin');
  });

  it('未登录(40101)抛 ApiError.unauthorized —— useAuth 据此置 anon', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => envelope(Code.Unauthorized, null, '未登录')));
    try {
      await me();
      expect.unreachable('应抛错');
    } catch (e) {
      expect((e as ApiError).unauthorized).toBe(true);
    }
  });

  it('网络错抛 ApiError(status=0,非 unauthorized)—— useAuth 据此置 error 而非 anon', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down'); }));
    try {
      await me();
      expect.unreachable('应抛错');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(0);
      expect((e as ApiError).unauthorized).toBe(false);
    }
  });
});

describe('logout', () => {
  it('网络错静默不抛(本地仍可切未登录态)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down'); }));
    await expect(logout()).resolves.toBeUndefined();
  });
});
