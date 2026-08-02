/**
 * /login —— studio 的未登录入口(决策 7)。左右分栏,对齐原型 login-brand / login-box。
 * 后端未接:提交直通,填充一个 demo user(level 驱动功能开关,约束 7)。接后端后换成校验响应。
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toggleTheme } from '@xingjuan/ui';
import { useAuthStore } from '../features/auth/useAuthStore.js';

export function LoginRoute() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [account, setAccount] = useState('');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // demo:任意账号直通;真实鉴权待后端
    login({ id: 'u_demo', name: account || '演示用户', level: 'pro' });
    navigate('/home', { replace: true });
  };

  return (
    <div className="login-wrap">
      {/* 左品牌区 */}
      <div className="login-brand">
        <div className="logo">
          <span className="dot">星</span>星卷
        </div>
        <div className="mid">
          <h2>用数据听见<br />每一个声音</h2>
          <p>从问卷设计到专业分析,一站式完成你的调研工作。</p>
          <div className="pts">
            <div className="pt"><span className="ck">✓</span><span className="tx">20+ 题型与强大逻辑引擎</span></div>
            <div className="pt"><span className="ck">✓</span><span className="tx">交叉分析与 SPSS 级统计</span></div>
            <div className="pt"><span className="ck">✓</span><span className="tx">多渠道回收与样本服务</span></div>
          </div>
        </div>
        <div className="foot">© 2026 星卷 · 让调研更简单</div>
      </div>

      {/* 右登录区 */}
      <div className="login-panel">
        <div className="util">
          <button className="icon-btn" title="主题" onClick={() => toggleTheme()}>🌓</button>
        </div>
        <form className="login-box" onSubmit={onSubmit}>
          <h3>欢迎回来</h3>
          <p className="sub">登录以继续管理你的问卷</p>
          <div className="field">
            <label>账号</label>
            <input type="text" value={account} placeholder="手机号 / 邮箱" onChange={(e) => setAccount(e.target.value)} />
          </div>
          <div className="field">
            <label>密码</label>
            <input type="password" placeholder="••••••••" />
          </div>
          <button type="submit" className="btn primary" style={{ width: '100%', justifyContent: 'center', padding: 11 }}>
            登录
          </button>
        </form>
      </div>
    </div>
  );
}
