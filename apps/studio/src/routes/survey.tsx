/**
 * /survey/:id/:tab —— 专注工作区。全局顶栏单行(对齐原型):Logo + 标题 + 状态徽章
 * + 预览/保存/取消编辑。tab 导航条已去除,tab 切换靠路由(看板入口按钮 + URL 直达)。
 *
 * 编辑→Editor(产品心脏);分析→Analysis(占位);预览→复用 getUI().Answer 渲染
 * 编辑器 store 的 schema——studio 不 import runtime,靠共享题型组件(印证内核共享、外壳不同);
 * 发布→占位。schema 现来自编辑器种子;:id 驱动加载与保存待后端 CRUD。
 */
import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { evaluate } from '@xingjuan/engine';
import { getAnswer } from '@xingjuan/question-types';
import { RequireAuth } from '../features/auth/RequireAuth.js';
import { TopBar } from '../components/TopBar.js';
import { Editor } from '../features/editor/Editor.js';
import { Analysis } from '../features/analysis/Analysis.js';
import { useEditorStore } from '../features/editor/useEditorStore.js';
import { getSurvey, saveSurvey, publishSurvey } from '../api/surveys.js';

const TABS = [
  { key: 'edit', label: '编辑' },
  { key: 'preview', label: '预览' },
  { key: 'publish', label: '发布回收' },
  { key: 'analyze', label: '数据分析' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

/** 预览:用与作答端相同的题型 Answer 渲染当前 schema(只读),逻辑求值隐藏题。 */
function Preview() {
  const schema = useEditorStore((s) => s.schema);
  const { hidden } = useMemo(() => evaluate(schema?.rules ?? [], {}), [schema?.rules]);
  if (!schema) return <p>未加载问卷</p>;
  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <h2 style={{ fontSize: 18 }}>{schema.title}</h2>
      {schema.questions
        .filter((q) => !hidden.has(q.id))
        .map((q) => {
          const Answer = getAnswer(q.type);
          return (
            <div key={q.id} style={{ margin: '12px 0', padding: 16, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12 }}>
              {Answer ? <Answer question={q} value={undefined} onChange={() => {}} disabled /> : <p>未知题型:{q.type}</p>}
            </div>
          );
        })}
    </div>
  );
}

export function SurveyRoute() {
  const { id, tab } = useParams<{ id: string; tab: string }>();
  const navigate = useNavigate();
  const load = useEditorStore((s) => s.load);
  const schema = useEditorStore((s) => s.schema);

  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  // 按 :id 从后端载入草稿 schema 进编辑器 store(替换种子)。id 变才重载。
  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoadState('loading');
    getSurvey(id)
      .then((s) => {
        if (!alive) return;
        load(s);
        setLoadState('ready');
      })
      .catch(() => alive && setLoadState('error'));
    return () => {
      alive = false;
    };
  }, [id, load]);

  const isTab = (t: string | undefined): t is TabKey => TABS.some((x) => x.key === t);
  if (!isTab(tab)) return <Navigate to={`/survey/${id}/edit`} replace />;

  const onSave = async () => {
    if (!schema) return;
    setSaving(true);
    setNotice('');
    try {
      await saveSurvey(schema);
      setNotice('已保存');
    } catch {
      setNotice('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const onPublish = async () => {
    if (!id || !schema) return;
    setSaving(true);
    setNotice('');
    try {
      await saveSurvey(schema); // 先存草稿再发布,确保快照是最新
      const version = await publishSurvey(id);
      setNotice(`已发布 v${version}`);
    } catch {
      setNotice('发布失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <RequireAuth>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <TopBar
          center={<span className="ftitle" style={{ marginLeft: 12 }}>{schema?.title ?? `问卷 ${id}`}</span>}
          actions={
            <>
              {notice && <span style={{ fontSize: 12, color: 'var(--ink-muted)', marginRight: 8 }}>{notice}</span>}
              <button className="btn sm" onClick={() => navigate(`/survey/${id}/preview`)}>预览</button>
              <button className="btn primary sm" disabled={saving || loadState !== 'ready'} onClick={onSave}>
                {saving ? '保存中…' : '保存'}
              </button>
              <button className="btn sm" onClick={() => navigate('/home')}>取消编辑</button>
            </>
          }
        />

        <div style={{ flex: 1, overflow: 'auto', background: 'var(--page)' }}>
          {loadState === 'loading' && <p style={{ color: 'var(--ink-muted)', padding: 24 }}>加载中…</p>}
          {loadState === 'error' && <p style={{ color: 'var(--critical)', padding: 24 }}>加载问卷失败</p>}
          {loadState === 'ready' && (
            <>
              {tab === 'edit' && <Editor />}
              {tab === 'preview' && <Preview />}
              {tab === 'analyze' && <Analysis />}
              {tab === 'publish' && (
                <div style={{ padding: 24 }}>
                  <p style={{ color: 'var(--ink-muted)', marginBottom: 16 }}>
                    发布后作答端可通过链接访问当前版本快照。渠道 / 二维码 / 回收控制待实现。
                  </p>
                  <button className="btn primary" disabled={saving} onClick={onPublish}>
                    {saving ? '发布中…' : '发布问卷'}
                  </button>
                  <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 12 }}>
                    作答端地址:<code>/#/s/{id}</code>(runtime,端口 5174)
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </RequireAuth>
  );
}
