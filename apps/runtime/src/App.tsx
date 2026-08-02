/**
 * 作答端入口:薄壳。按 :id 加载 schema → 交给 Fill 作答 → 提交后 Done。
 * runtime 保持轻:无路由库、无图表、无 studio 依赖(铁律)。作答态走 useReducer + engine。
 *
 * schema 来源:优先 fetchSurvey(真实端点);api-contract 未定/dev 无后端时回落内联 demo 并标注,
 * 让 `pnpm dev:runtime` 开箱可跑且诚实。
 */
import { useEffect, useState } from 'react';
import type { SurveySchema } from '@xingjuan/engine';
import { fetchSurvey } from './api/client.js';
import { Fill } from './pages/Fill.js';
import { Done } from './pages/Done.js';
import { useFill } from './useFill.js';

/** 演示问卷:含一条显隐逻辑(q1 选“没用过”→ 隐藏 q2)。回落用。 */
const DEMO: SurveySchema = {
  id: 'demo',
  type: 'survey',
  title: '示例问卷(演示数据)',
  version: 1,
  questions: [
    {
      id: 'q1',
      type: 'single-choice',
      title: '你用过星卷吗?',
      required: true,
      props: {
        options: [
          { value: 'yes', label: '用过' },
          { value: 'no', label: '没用过' },
        ],
      },
    },
    {
      id: 'q2',
      type: 'scale',
      title: '整体满意程度?',
      required: true,
      props: { min: 1, max: 5, minLabel: '很不满意', maxLabel: '非常满意' },
    },
  ],
  rules: [
    { id: 'r1', conditions: [{ qid: 'q1', op: 'eq', value: 'no' }], combinator: 'AND', action: { type: 'hide', target: 'q2' } },
  ],
};

/** 从 hash(#/s/:id)取问卷 id;无则空。 */
function surveyIdFromHash(): string {
  const m = (location.hash || '').match(/^#\/s\/([^/]+)/);
  return m ? decodeURIComponent(m[1]!) : '';
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; schema: SurveySchema; demo: boolean }
  | { status: 'error'; message: string };

export function App() {
  const id = surveyIdFromHash();
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let alive = true;
    // 无 id 直接用 demo;有 id 打端点,失败回落 demo 并标注。
    if (!id) {
      setLoad({ status: 'ready', schema: DEMO, demo: true });
      return;
    }
    fetchSurvey(id)
      .then((schema) => alive && setLoad({ status: 'ready', schema, demo: false }))
      .catch(() => alive && setLoad({ status: 'ready', schema: { ...DEMO, id }, demo: true }));
    return () => {
      alive = false;
    };
  }, [id]);

  if (load.status === 'loading') {
    return <main style={{ fontFamily: 'var(--font)', textAlign: 'center', padding: 48, color: 'var(--ink-muted)' }}>加载中…</main>;
  }
  if (load.status === 'error') {
    return <main style={{ fontFamily: 'var(--font)', textAlign: 'center', padding: 48, color: 'var(--critical)' }}>{load.message}</main>;
  }
  return <Survey schema={load.schema} demo={load.demo} />;
}

/** 承载单份问卷的作答态(useFill 依赖稳定的 surveyId,故拆成子组件按 schema.id 挂载)。 */
function Survey({ schema, demo }: { schema: SurveySchema; demo: boolean }) {
  const [state, dispatch] = useFill(schema.id);

  return (
    <div style={{ background: 'var(--page)', minHeight: '100vh' }}>
      {demo && (
        <div style={{ background: 'var(--brand-weak)', color: 'var(--brand)', textAlign: 'center', padding: '6px 12px', fontSize: 12 }}>
          演示数据(未连接后端)
        </div>
      )}
      {state.phase === 'fill' ? (
        <Fill schema={schema} state={state} dispatch={dispatch} />
      ) : (
        <Done rows={state.submittedRows} dispatch={dispatch} />
      )}
    </div>
  );
}
