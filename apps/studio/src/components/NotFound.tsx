/**
 * 默认 404 页:所有「地址错误 / 页面不存在」统一走这里,视觉一致。
 * 纯展示组件(TopBar + 居中面板 + 返回看板);是否鉴权由调用方决定(需要就外层包 RequireAuth)。
 * 例外:App.tsx 顶层 catch-all(path="*")按既定决策仍静默跳 /home,不用此页。
 */
import { useNavigate } from 'react-router-dom';
import { TopBar } from './TopBar.js';

interface NotFoundProps {
  /** 可选补充说明(如「没有『publsh』这个标签页」),不传则只显通用文案。 */
  detail?: string;
}

export function NotFound({ detail }: NotFoundProps) {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar />
      <main style={{ flex: 1, display: 'grid', placeItems: 'center', background: 'var(--page)', textAlign: 'center', padding: 24 }}>
        <div>
          <div style={{ fontSize: 44, marginBottom: 12 }}>😕</div>
          <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>404 · 页面不存在</p>
          {detail && <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 6 }}>{detail}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
            <button className="btn primary sm" onClick={() => navigate('/home')}>返回看板</button>
          </div>
        </div>
      </main>
    </div>
  );
}
