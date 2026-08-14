/**
 * studio 专属 HTTP 客户端(已鉴权,信任边界内)。
 *
 * 统一响应信封(后端 render.go):业务响应恒 HTTP 200,body = { code, message, data }。
 * code=0 成功,返回 data;code!=0 业务错,抛 Error(message)。
 * 框架层失败(未登录 401、5xx、网络等)走原生非-2xx,同样抛 Error。
 */
const BASE = import.meta.env.VITE_API_BASE ?? '/api';

/** 业务错误码(对齐后端 internal/ecode)。0=成功。 */
export const Code = {
  OK: 0,
  BadRequest: 40001,
  Unauthorized: 40101,
  NotFound: 40401,
  Validation: 42201,
  TooManyRequests: 42901,
  Conflict: 40901,
  Internal: 50001,
} as const;

interface Envelope<T> {
  code: number;
  message: string;
  data: T;
}

/**
 * API 错误:携带业务错误码(code)供调用方分流处理(如 40901 已发布不可编辑)。
 * 框架层失败(非 2xx,无信封)时 code 为 undefined,只有 httpStatus。
 * 继承 Error,message 仍可用,既有只读 message 的 catch 不受影响。
 */
export class ApiError extends Error {
  readonly code?: number;
  readonly httpStatus?: number;
  constructor(message: string, opts: { code?: number; httpStatus?: number }) {
    super(message);
    this.name = 'ApiError';
    this.code = opts.code;
    this.httpStatus = opts.httpStatus;
  }
}

/**
 * 统一取响应:
 * - HTTP 非 2xx(框架层失败,如未登录 401)→ 抛 ApiError(httpStatus)。
 * - HTTP 2xx → 解信封;code!=0 抛 ApiError(code, message);code=0 返回 data。
 */
async function take<T>(res: Response, path: string, method: string): Promise<T> {
  if (!res.ok) {
    throw new ApiError(`${method} ${path} 失败: ${res.status}`, { httpStatus: res.status });
  }
  const env = (await res.json()) as Envelope<T>;
  if (env.code !== Code.OK) {
    throw new ApiError(env.message || `${method} ${path} 失败: ${env.code}`, { code: env.code });
  }
  return env.data;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { credentials: 'include' });
  return take<T>(res, path, 'GET');
}

export async function apiSend<T>(path: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return take<T>(res, path, method);
}
