/**
 * 登录态形状(决策 7:登录并入 studio,不单独成 app)。
 * Zustand 接线随 auth 切片引入;此处先定契约。功能开关按 level 驱动(约束 7)。
 */
export interface AuthUser {
  id: string;
  name: string;
  /** 账户等级,驱动功能可见性(PRD §9 约束 7) */
  level: 'free' | 'pro' | 'team' | 'enterprise';
}

export interface AuthState {
  /** 未登录为 null */
  user: AuthUser | null;
}

export const initialAuthState: AuthState = { user: null };
