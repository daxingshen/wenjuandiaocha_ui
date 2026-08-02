/**
 * 路由 guard:未登录重定向到 /login。随 auth 切片接入路由与 store 后填实,
 * 现按直通占位(不引路由依赖)。
 */
import type { ReactNode } from 'react';

export function RequireAuth({ children }: { children: ReactNode }) {
  // TODO(auth 切片): 读 useAuthStore,未登录时 <Navigate to="/login" />
  return <>{children}</>;
}
