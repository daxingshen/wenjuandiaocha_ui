/**
 * 登录闸门(login_required 问卷,未登录时展示 —— 方案A·D4,视觉见 03-design 乙)。
 *
 * 定位:这不是 studio 的创作者营销登录。作答者点开了一条「具体问卷」的链接,被要求先登录再作答。
 * 主角是问卷本身:卡片顶部 hero-grad「封缄色带」+ 其下托起的问卷标题,让人一眼确认「我来对了地方」。
 * 只做一件事——登录进这份问卷;不放「注册/忘记密码/记住我」(respondent 账号平台发放,此处无落点)。
 *
 * 登录成功 → onDone(user):App 置 authed 态、同一 URL 不跳转,直接进作答。
 */
import { useState } from 'react';
import { toggleTheme } from '@xingjuan/ui';
import { ApiError } from '../api/client.js';
import type { AuthUser } from '../api/auth.js';

export function LoginGate({
  surveyTitle,
  login,
  onDone,
}: {
  surveyTitle: string;
  login: (account: string, password: string) => Promise<AuthUser>;
  onDone: (user: AuthUser) => void;
}) {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const user = await login(account.trim(), password);
      onDone(user);
    } catch (err) {
      // 方向而非情绪:告诉作答者哪里不对、怎么办。网络错与账密错分文案。
      const msg =
        err instanceof ApiError && err.status === 0
          ? '网络不太稳定,请检查连接后再试一次'
          : '账号或密码不对,再试一次';
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="rgate-wrap">
      <button type="button" className="rgate-theme" title="切换主题" onClick={() => toggleTheme()}>
        🌓
      </button>
      <form className="rgate-card" onSubmit={onSubmit}>
        {/* 签名:封缄色带 —— 这份问卷的「封口」,登录即启封。 */}
        <div className="rgate-seal" aria-hidden="true" />
        <div className="rgate-body">
          <p className="rgate-eyebrow">星卷 · 问卷邀请</p>
          <h1 className="rgate-title">{surveyTitle}</h1>
          <p className="rgate-gate">这份问卷需要登录后作答</p>

          <label className="rgate-field">
            <span>账号</span>
            <input
              type="text"
              autoComplete="username"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              required
              autoFocus
            />
          </label>
          <label className="rgate-field">
            <span>密码</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button type="submit" className="rgate-submit" disabled={busy}>
            {busy ? '登录中…' : '登录并开始作答'}
          </button>
          {error && (
            <p className="rgate-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </form>
    </main>
  );
}
