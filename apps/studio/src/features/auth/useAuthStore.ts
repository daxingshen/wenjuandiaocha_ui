/**
 * 登录态(Zustand + persist)。登录并入 studio(决策 7),不单独成 app。
 * persist 到 localStorage:刷新不掉登录。功能开关按 level 驱动(约束 7)。
 *
 * 后端未接:login 现由登录页传入 demo user;接后端后换成校验响应填充。
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  name: string;
  /** 账户等级,驱动功能可见性(PRD §9 约束 7) */
  level: 'free' | 'pro' | 'team' | 'enterprise';
}

export interface AuthState {
  /** 未登录为 null */
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    { name: 'xingjuan:auth' },
  ),
);
