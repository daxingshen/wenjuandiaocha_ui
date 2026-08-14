/**
 * 作答端鉴权 HTTP:login / logout / me。仅 login_required 问卷用到。
 *
 * 后端用 session cookie(HttpOnly,JS 读不到),故所有请求带 credentials:'include' 让浏览器
 * 自动携带 cookie;登录态靠 me() 探测,不在前端持有 token。响应走统一信封(同 client.ts)。
 *
 * runtime 独立铁律:不引 studio、不引全局 store。此模块只封装请求,登录态由 useAuth 用 useState 持有。
 */
import { ApiError, Code } from './client.js';

const BASE = import.meta.env.VITE_API_BASE ?? '/api';

/** 作答者身份。role 用于区分能否作答(respondent/admin 可,creator 不可)。 */
export interface AuthUser {
  id: string;
  name: string;
  role: string;
}

interface Envelope<T> {
  code: number;
  message: string;
  data: T;
}

/** 解信封:非 2xx / code!=0 抛 ApiError(带 code + status),供调用方分级(401 未登录、40301 无权限)。 */
async function take<T>(res: Response, netMsg: string): Promise<T> {
  if (!res.ok) {
    let msg = `请求失败: ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (typeof body.error === 'string') msg = body.error;
    } catch {
      // 非 JSON:保留默认
    }
    throw new ApiError(res.status, msg);
  }
  let env: Envelope<T>;
  try {
    env = (await res.json()) as Envelope<T>;
  } catch {
    throw new ApiError(res.status, netMsg);
  }
  if (env.code !== Code.OK) {
    throw new ApiError(res.status, env.message || `请求失败: ${env.code}`, env.code);
  }
  return env.data;
}

/** 账密登录;成功后端下发 session cookie,返回用户信息。账密错抛 ApiError。 */
export async function login(account: string, password: string): Promise<AuthUser> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ account, password }),
    });
  } catch {
    throw new ApiError(0, '网络异常,登录未成功');
  }
  return take<AuthUser>(res, '登录失败,请稍后重试');
}

/** 登出:后端删 session + 清 cookie。失败静默(本地已切未登录态即可)。 */
export async function logout(): Promise<void> {
  try {
    await fetch(`${BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
  } catch {
    // 网络异常:忽略,前端仍切到未登录态
  }
}

/** 探测当前登录用户;未登录抛 ApiError(unauthorized)。启动时用它确认会话。 */
export async function me(): Promise<AuthUser> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/auth/me`, { credentials: 'include' });
  } catch {
    throw new ApiError(0, '网络异常,无法确认登录状态');
  }
  return take<AuthUser>(res, '无法确认登录状态');
}
