/**
 * client 契约单测(node 环境,stub fetch,零真实网络)。锁死本轮新增契约:
 *   - fetchSurvey 解 { schema, answerAccess },未知/缺省 access 回落 anonymous;
 *   - submitAnswers(匿名,不带 cookie,/public 路径)vs submitAnswersAuthed(鉴权,带 cookie,/surveys 路径);
 *   - ApiError.forbidden(40301)/unauthorized(40101)分级,供 Fill 提交错误分流与 useAuth 探测判定。
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { ApiError, Code, fetchSurvey, submitAnswers, submitAnswersAuthed } from './client.js';

// 200 信封响应(code=0 成功 / code!=0 业务错)。
function envelope(code: number, data: unknown, message = '') {
  return { ok: true, status: 200, json: async () => ({ code, message, data }) };
}
// 原生非-2xx(框架层失败)。
function raw(status: number, body: unknown = {}) {
  return { ok: false, status, json: async () => body };
}

afterEach(() => vi.unstubAllGlobals());

describe('fetchSurvey', () => {
  it('解 { schema, answerAccess },login_required 原样返回', async () => {
    const schema = { id: 's1', type: 'survey', title: 'T', version: 1, questions: [], rules: [] };
    vi.stubGlobal('fetch', vi.fn(async () => envelope(Code.OK, { schema, answerAccess: 'login_required' })));
    const res = await fetchSurvey('s1');
    expect(res.answerAccess).toBe('login_required');
    expect(res.schema.id).toBe('s1');
  });

  it('缺省 answerAccess 回落 anonymous(兼容旧后端/历史数据)', async () => {
    const schema = { id: 's1', type: 'survey', title: 'T', version: 1, questions: [], rules: [] };
    vi.stubGlobal('fetch', vi.fn(async () => envelope(Code.OK, { schema })));
    const res = await fetchSurvey('s1');
    expect(res.answerAccess).toBe('anonymous');
  });

  it('未知 answerAccess 值也回落 anonymous', async () => {
    const schema = { id: 's1', type: 'survey', title: 'T', version: 1, questions: [], rules: [] };
    vi.stubGlobal('fetch', vi.fn(async () => envelope(Code.OK, { schema, answerAccess: 'bogus' })));
    const res = await fetchSurvey('s1');
    expect(res.answerAccess).toBe('anonymous');
  });

  it('40401 抛 ApiError.notFound', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => envelope(Code.NotFound, null, '不存在')));
    await expect(fetchSurvey('s1')).rejects.toMatchObject({ notFound: true });
  });
});

describe('submitAnswers vs submitAnswersAuthed', () => {
  it('匿名:命中 /public 路径,credentials=omit(不带 cookie)', async () => {
    const spy = vi.fn(async (_url: string, _init?: RequestInit) => envelope(Code.OK, { rows: 2 }));
    vi.stubGlobal('fetch', spy);
    const res = await submitAnswers('s1', 3, { q1: 'a' });
    expect(res.rows).toBe(2);
    const [url, init] = spy.mock.calls[0]!;
    expect(String(url)).toContain('/public/surveys/s1/answers');
    expect(init!.credentials).toBe('omit');
    expect(JSON.parse(init!.body as string)).toEqual({ answers: { q1: 'a' }, version: 3 });
  });

  it('鉴权:命中 /surveys 路径,credentials=include(带 cookie)', async () => {
    const spy = vi.fn(async (_url: string, _init?: RequestInit) => envelope(Code.OK, { rows: 1 }));
    vi.stubGlobal('fetch', spy);
    await submitAnswersAuthed('s1', 5, { q1: 'b' });
    const [url, init] = spy.mock.calls[0]!;
    expect(String(url)).toContain('/surveys/s1/answers');
    expect(String(url)).not.toContain('/public/');
    expect(init!.credentials).toBe('include');
    expect(JSON.parse(init!.body as string)).toEqual({ answers: { q1: 'b' }, version: 5 });
  });

  it('鉴权提交 40301 → ApiError.forbidden(creator 无作答权限)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => envelope(Code.Forbidden, null, '无权限')));
    try {
      await submitAnswersAuthed('s1', 1, {});
      expect.unreachable('应抛错');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).forbidden).toBe(true);
      expect((e as ApiError).unauthorized).toBe(false);
    }
  });
});

describe('ApiError 分级', () => {
  it('40101 → unauthorized', () => {
    expect(new ApiError(200, 'x', Code.Unauthorized).unauthorized).toBe(true);
  });
  it('原生 401(无 code)→ unauthorized', () => {
    expect(new ApiError(401, 'x').unauthorized).toBe(true);
  });
  it('40301 → forbidden,且非 notFound/unauthorized', () => {
    const e = new ApiError(200, 'x', Code.Forbidden);
    expect(e.forbidden).toBe(true);
    expect(e.notFound).toBe(false);
    expect(e.unauthorized).toBe(false);
  });
});
