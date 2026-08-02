/**
 * 全局顶栏(app-top):贯穿所有已登录页面(看板 + 专注工作区)。
 * Logo(→ /home)+ 可选 center 槽(工作区放 tab 导航)+ spacer + 主题/语言开关 + 通知 + 头像。
 * 对齐原型 app-top:util 内含主题(🌙/☀)与语言(中/EN)开关。
 *
 * 注:语言按钮结构对齐原型(切 data-lang),但 i18n 字典尚未接入,当前不真正翻译文案。
 */
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toggleTheme } from '@xingjuan/ui';
import { useAuthStore } from '../features/auth/useAuthStore.js';

function toggleLang() {
  const cur = document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'zh';
  document.documentElement.setAttribute('data-lang', cur === 'en' ? 'zh' : 'en');
}

export function TopBar({ center, actions }: { center?: ReactNode; actions?: ReactNode }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <header className="app-top">
      <div className="logo" onClick={() => navigate('/home')}>
        <span className="dot">星</span>星卷
      </div>
      {center}
      <div className="spacer" />
      <div className="util">
        <button className="icon-btn" title="主题" onClick={() => toggleTheme()}>🌙</button>
        <button className="lang-btn" title="语言" onClick={() => toggleLang()}>EN</button>
      </div>
      <button className="icon-btn" title="通知">🔔</button>
      {actions}
      <div className="avatar" title={`${user?.name ?? ''} · 点击退出`} onClick={logout}>
        {user?.name?.[0] ?? 'X'}
      </div>
    </header>
  );
}
