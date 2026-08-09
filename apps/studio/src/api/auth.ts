/**
 * 鉴权端点封装。后端用 session cookie(credentials:'include' 在 client.ts 已带)。
 * 登录响应即前端 AuthUser 形状 { id, name, level }。
 */
import { apiGet, apiSend } from './client.js';
import type { AuthUser } from '../features/auth/useAuthStore.js';

/** 账密登录;成功后端下发 session cookie,返回用户信息。 */
export async function login(account: string, password: string): Promise<AuthUser> {
  return apiSend<AuthUser>('/auth/login', 'POST', { account, password });
}

/** 登出:后端删 session + 清 cookie。 */
export async function logout(): Promise<void> {
  await apiSend<{ ok: boolean }>('/auth/logout', 'POST');
}

/** 取当前登录用户;未登录抛错(401)。 */
export async function me(): Promise<AuthUser> {
  return apiGet<AuthUser>('/auth/me');
}
