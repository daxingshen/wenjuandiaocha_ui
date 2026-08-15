/**
 * 全局顶栏(app-top):贯穿所有已登录页面(看板 + 专注工作区)。
 * Logo(→ /home)+ 可选 center 槽(工作区放 tab 导航)+ spacer + 主题/语言开关 + 通知 + 头像。
 * 对齐原型 app-top:util 内含主题(🌙/☀)与语言(中/EN)开关。
 *
 * 头像区:头像左侧显示用户名,点头像展开下拉菜单(自研轻量浮层)。退出登录挪进菜单。
 * 点头像不再直接退出、不跳转;菜单其余项本轮留占位。
 *
 * 注:语言按钮结构对齐原型(切 data-lang),但 i18n 字典尚未接入,当前不真正翻译文案。
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
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
  // 头像下拉开合。点头像 toggle;点浮层外部或按 Esc 关闭。
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

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

      {/* 头像 + 用户名 + 下拉菜单 */}
      <div className="avatar-menu" ref={menuRef}>
        <button
          className="avatar-trigger"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="avatar">{user?.name?.[0] ?? 'X'}</span>
          <span className="uname">{user?.name ?? ''}</span>
        </button>
        {menuOpen && (
          <nav className="avatar-dropdown" role="menu">
            <div className="am-head">
              <div className="am-name">{user?.name ?? ''}</div>
              <div className="am-level">{user?.level ?? ''}</div>
            </div>
            {/* 占位:后续菜单项(账户设置、帮助等)接入这里 */}
            <div className="am-sep" />
            <button className="am-item" role="menuitem" onClick={() => { setMenuOpen(false); logout(); }}>
              退出登录
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
