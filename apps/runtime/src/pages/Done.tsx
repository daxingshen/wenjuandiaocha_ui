/** 提交完成页。答案已提交(后端权威),本地已清盘。提供再填一份。 */
import type { FillAction } from '../useFill.js';

export function Done({ rows, dispatch }: { rows: number; dispatch: React.Dispatch<FillAction> }) {
  return (
    <main
      style={{
        fontFamily: 'var(--font)',
        maxWidth: 480,
        margin: '0 auto',
        padding: 16,
        color: 'var(--ink)',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 48, margin: '48px 0 16px' }}>✓</div>
      <h1 style={{ fontSize: 20 }}>提交成功,感谢作答</h1>
      <p style={{ color: 'var(--ink-muted)', marginTop: 8 }}>已记录本次作答的 {rows} 条规范化数据。</p>
      <button
        type="button"
        onClick={() => dispatch({ type: 'reset' })}
        style={{
          marginTop: 24,
          padding: '10px 20px',
          border: '1px solid var(--line)',
          borderRadius: 8,
          background: 'var(--surface)',
          color: 'var(--ink)',
          cursor: 'pointer',
        }}
      >
        再填一份
      </button>
    </main>
  );
}
