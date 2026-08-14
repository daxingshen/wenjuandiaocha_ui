/**
 * 作答端入口:薄壳。按 :id 加载 schema → 交给 Fill 作答 → 提交后 Done。
 * runtime 保持轻:无路由库、无图表、无 studio 依赖(铁律)。作答态走 useReducer + engine。
 *
 * schema 来源:优先 fetchSurvey(真实端点);api-contract 未定/dev 无后端时回落内联 demo 并标注,
 * 让 `pnpm dev:runtime` 开箱可跑且诚实。
 */
import { useEffect, useState } from 'react';
import type { SurveySchema } from '@xingjuan/engine';
import { ApiError, fetchSurvey, submitAnswers, submitAnswersAuthed, type AnswerAccess, type SubmitFn } from './api/client.js';
import { Fill, type FillAuth } from './pages/Fill.js';
import { Done } from './pages/Done.js';
import { LoginGate } from './pages/LoginGate.js';
import { useFill } from './useFill.js';
import { useAuth } from './useAuth.js';

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
  | { status: 'ready'; schema: SurveySchema; answerAccess: AnswerAccess; demo: boolean }
  // notFound=true(后端 404:不存在/未发布/已结束)不可重试;否则(网络/5xx)可重试
  | { status: 'error'; message: string; notFound: boolean };

export function App() {
  // id 存进 state 并监听 hashchange:改 URL 的 #/s/:id 片段是「同文档导航」,浏览器不刷新页面、
  // 只触发 hashchange。不订阅它则 React 不重渲染、加载 effect(keyed on id)不重跑,得手动 Ctrl+R。
  const [id, setId] = useState(surveyIdFromHash);
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const onHashChange = () => setId(surveyIdFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    let alive = true;
    // 无 id:本地开发直开,用 demo 并标注(anonymous)。真实 :id 链接不再回落 demo(gate① 决议)。
    if (!id) {
      setLoad({ status: 'ready', schema: DEMO, answerAccess: 'anonymous', demo: true });
      return;
    }
    setLoad({ status: 'loading' });
    fetchSurvey(id)
      .then(({ schema, answerAccess }) => alive && setLoad({ status: 'ready', schema, answerAccess, demo: false }))
      .catch((e: unknown) => {
        if (!alive) return;
        const notFound = e instanceof ApiError && e.notFound;
        setLoad({
          status: 'error',
          notFound,
          message: notFound
            ? '问卷不存在、未发布或已结束'
            : e instanceof ApiError && e.message
              ? e.message
              : '加载失败,请稍后重试',
        });
      });
    return () => {
      alive = false;
    };
  }, [id, reloadKey]);

  if (load.status === 'loading') {
    return <main style={{ fontFamily: 'var(--font)', textAlign: 'center', padding: 48, color: 'var(--ink-muted)' }}>加载中…</main>;
  }
  if (load.status === 'error') {
    return (
      <main style={{ fontFamily: 'var(--font)', textAlign: 'center', padding: 48, color: 'var(--ink)' }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>😕</div>
        <p style={{ color: 'var(--critical)', fontSize: 16 }}>{load.message}</p>
        {!load.notFound && (
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            style={{
              marginTop: 20,
              padding: '10px 20px',
              border: '1px solid var(--line)',
              borderRadius: 8,
              background: 'var(--surface)',
              color: 'var(--ink)',
              cursor: 'pointer',
            }}
          >
            重试
          </button>
        )}
      </main>
    );
  }
  // anonymous:直接作答(现状,不触发登录探测)。login_required:先过登录闸门(Gated 内含 useAuth)。
  // key 绑 id:v{version}:软导航(改 hash 换问卷)或换版时强制重挂,让 useFill 按新 (id,version) 重跑惰性初始化。
  const key = `${load.schema.id}:v${load.schema.version}`;
  if (load.answerAccess === 'login_required') {
    return <Gated key={key} schema={load.schema} />;
  }
  return <Survey key={key} schema={load.schema} demo={load.demo} submit={submitAnswers} />;
}

/**
 * login_required 问卷的登录闸门(方案A·D1/D4)。进入时探测一次 me():
 * 未登录展示 LoginGate,登录后同一 URL 不跳转、直接进 Survey(鉴权提交 + 头部登出)。
 */
function Gated({ schema }: { schema: SurveySchema }) {
  const auth = useAuth();

  // 进入即探测会话一次(仅 login_required 分支;anonymous 永不走到这里)。
  useEffect(() => {
    void auth.probe();
  }, [auth.probe]);

  if (auth.status === 'unknown') {
    return <main style={{ fontFamily: 'var(--font)', textAlign: 'center', padding: 48, color: 'var(--ink-muted)' }}>加载中…</main>;
  }
  if (auth.status === 'error') {
    return (
      <main style={{ fontFamily: 'var(--font)', textAlign: 'center', padding: 48, color: 'var(--ink)' }}>
        <p style={{ color: 'var(--critical)', fontSize: 16 }}>无法确认登录状态,请检查网络</p>
        <button
          type="button"
          onClick={() => void auth.probe()}
          style={{ marginTop: 20, padding: '10px 20px', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink)', cursor: 'pointer' }}
        >
          重试
        </button>
      </main>
    );
  }
  if (auth.status === 'anon' || !auth.user) {
    // 登录成功由 auth.login 置 authed,组件重渲染进 Survey;LoginGate 的 onDone 仅用于即时衔接。
    return <LoginGate surveyTitle={schema.title} login={auth.login} onDone={() => { /* 态已在 login 内置为 authed */ }} />;
  }
  const fillAuth: FillAuth = { name: auth.user.name, onLogout: () => void auth.logout() };
  return <Survey schema={schema} demo={false} submit={submitAnswersAuthed} auth={fillAuth} />;
}

/** 承载单份问卷的作答态(useFill 依赖稳定的 surveyId,故拆成子组件按 schema.id 挂载)。 */
function Survey({ schema, demo, submit, auth }: { schema: SurveySchema; demo: boolean; submit: SubmitFn; auth?: FillAuth }) {
  // useFill 依赖稳定的 (surveyId, version):版本锚定,换版后 key 变、答案集隔离。
  const [state, dispatch] = useFill(schema.id, schema.version);

  return (
    <div style={{ background: 'var(--page)', minHeight: '100vh' }}>
      {demo && (
        <div style={{ background: 'var(--brand-weak)', color: 'var(--brand)', textAlign: 'center', padding: '6px 12px', fontSize: 12 }}>
          演示数据(未连接后端)
        </div>
      )}
      {state.phase === 'fill' ? (
        <Fill schema={schema} state={state} dispatch={dispatch} submit={submit} auth={auth} />
      ) : (
        <Done rows={state.submittedRows} dispatch={dispatch} auth={auth} />
      )}
    </div>
  );
}
