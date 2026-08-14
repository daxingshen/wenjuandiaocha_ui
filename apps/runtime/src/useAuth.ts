/**
 * 作答端极简登录态(useState,不引全局 store —— 守 runtime 独立铁律,决策 11)。
 *
 * session cookie 是 HttpOnly,JS 读不到,故登录态靠 me() 探测:
 *   - status='unknown':尚未探测(初始)。login_required 分支进入前调 probe() 探一次。
 *   - status='anon':已探测且未登录(me 返回 401)→ 展示登录闸门。
 *   - status='authed':已登录,user 有值 → 可作答。
 *   - status='error':探测遇网络错误(非 401),可重试,不误判为未登录。
 *
 * anonymous 问卷不触发探测(省一次请求 + 守「匿名行为零变化」)。
 */
import { useCallback, useState } from 'react';
import { ApiError } from './api/client.js';
import { login as apiLogin, logout as apiLogout, me as apiMe, type AuthUser } from './api/auth.js';

export type AuthStatus = 'unknown' | 'anon' | 'authed' | 'error';

export interface AuthApi {
  status: AuthStatus;
  user: AuthUser | null;
  /** 探测会话:me() 成功→authed;401→anon;网络错→error。幂等,可重试。 */
  probe: () => Promise<void>;
  /** 账密登录;成功置 authed 并返回 user,失败抛 ApiError(供闸门显示错误)。 */
  login: (account: string, password: string) => Promise<AuthUser>;
  /** 登出:清后端 session + 本地切 anon。 */
  logout: () => Promise<void>;
}

export function useAuth(): AuthApi {
  const [status, setStatus] = useState<AuthStatus>('unknown');
  const [user, setUser] = useState<AuthUser | null>(null);

  const probe = useCallback(async () => {
    try {
      const u = await apiMe();
      setUser(u);
      setStatus('authed');
    } catch (e) {
      // 401/未登录 → anon(展示闸门);其它(网络/5xx)→ error(可重试,不误判未登录)。
      if (e instanceof ApiError && e.unauthorized) {
        setUser(null);
        setStatus('anon');
      } else {
        setStatus('error');
      }
    }
  }, []);

  const login = useCallback(async (account: string, password: string) => {
    const u = await apiLogin(account, password);
    setUser(u);
    setStatus('authed');
    return u;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setStatus('anon');
  }, []);

  return { status, user, probe, login, logout };
}
