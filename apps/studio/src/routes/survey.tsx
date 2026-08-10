/**
 * /survey/:id/:tab —— 专注工作区。全局顶栏单行(对齐原型):Logo + 标题 + 状态徽章
 * + 预览/保存/返回。tab 导航条已去除,tab 切换靠路由(看板入口按钮 + URL 直达)。
 *
 * 编辑→Editor(产品心脏);分析→Analysis(占位);预览→复用 getUI().Answer 渲染
 * 编辑器 store 的 schema——studio 不 import runtime,靠共享题型组件(印证内核共享、外壳不同);
 * 发布→占位。schema 现来自编辑器种子;:id 驱动加载与保存待后端 CRUD。
 */
import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { RequireAuth } from '../features/auth/RequireAuth.js';
import { TopBar } from '../components/TopBar.js';
import { SaveDialog } from '../components/SaveDialog.js';
import { Editor } from '../features/editor/Editor.js';
import { Analysis } from '../features/analysis/Analysis.js';
import { Preview } from '../features/preview/Preview.js';
import { Publish } from '../features/publish/Publish.js';
import { useEditorStore } from '../features/editor/useEditorStore.js';
import type { SurveySchema } from '@xingjuan/engine';
import { getSurvey, saveSurvey, createSurvey, publishSurvey } from '../api/surveys.js';

/** 新建时的空白内存草稿(未落库,首存前只存在于编辑器 store)。 */
function emptyDraft(): SurveySchema {
  return { id: 'new', type: 'survey', title: '未命名问卷', version: 1, questions: [], rules: [] };
}

const TABS = [
  { key: 'edit', label: '编辑' },
  { key: 'preview', label: '预览' },
  { key: 'publish', label: '发布回收' },
  { key: 'analyze', label: '数据分析' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

export function SurveyRoute() {
  const { id, tab } = useParams<{ id: string; tab: string }>();
  const navigate = useNavigate();
  const load = useEditorStore((s) => s.load);
  const schema = useEditorStore((s) => s.schema);
  const setTitle = useEditorStore((s) => s.setTitle);

  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // :id==='new' 是内存草稿态:不调后端(避免 404),直接载入空白草稿,首存时才落库。
  // 其余按 :id 从后端载入草稿 schema 进编辑器 store。id 变才重载。
  useEffect(() => {
    if (!id) return;
    if (id === 'new') {
      load(emptyDraft());
      setLoadState('ready');
      return;
    }
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

  // 首存:内存草稿(id==='new')POST 落库拿真实 id,写回 store 并把 URL 换成真实 id(replace,不留 new 历史)。
  // 返回落库后的真实 id 供发布等后续动作复用;非新建走 PUT。
  const persist = async (): Promise<string> => {
    if (!schema) throw new Error('no schema');
    if (id === 'new') {
      const realId = await createSurvey(schema);
      load({ ...schema, id: realId });
      navigate(`/survey/${realId}/edit`, { replace: true });
      return realId;
    }
    await saveSurvey(schema);
    return id!;
  };

  // 弹窗的「保存」/「保存并返回」共用此逻辑;back=true 时存成功后回看板。
  const onSave = async (back: boolean) => {
    if (!schema) return;
    setSaving(true);
    setNotice('');
    try {
      await persist();
      setSaveDialogOpen(false);
      if (back) {
        navigate('/home');
      } else {
        setNotice('已保存');
      }
    } catch {
      setNotice('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 供发布回收页调用:先存草稿(含首存落库拿真实 id)再发布,返回真实 id;错误上抛供组件自行提示。
  const publishFromPage = async (): Promise<string> => {
    if (!schema) throw new Error('no schema');
    const realId = await persist();
    await publishSurvey(realId);
    return realId;
  };

  // 顶栏操作组按 tab 场景切换:每个 tab 只留与当下动作相符的按钮(对齐原型)。
  const saveBtn = (
    <button className="btn primary sm" disabled={saving || loadState !== 'ready'} onClick={() => setSaveDialogOpen(true)}>
      {saving ? '保存中…' : '保存'}
    </button>
  );
  const renderActions = () => {
    switch (tab) {
      case 'preview':
        // 正在验证作答,动作是回去改或去发布——不再有冗余的「预览」
        return (
          <>
            <button className="btn sm" onClick={() => navigate(`/survey/${id}/edit`)}>✎ 返回编辑</button>
            <button className="btn primary sm" onClick={() => navigate(`/survey/${id}/publish`)}>🚀 发布问卷</button>
          </>
        );
      case 'publish':
        // 发布/结束/重开/复制链接等场景动作在页面内(Publish),顶栏只留导航,避免双入口。
        return (
          <>
            <button className="btn sm" onClick={() => navigate(`/survey/${id}/edit`)}>✎ 编辑</button>
            <button className="btn sm" onClick={() => navigate('/home')}>返回</button>
          </>
        );
      case 'analyze':
        return <button className="btn sm" onClick={() => navigate('/home')}>返回</button>;
      case 'edit':
      default:
        return (
          <>
            <button className="btn sm" onClick={() => navigate(`/survey/${id}/preview`)}>预览</button>
            {saveBtn}
            <button className="btn sm" onClick={() => navigate('/home')}>返回</button>
          </>
        );
    }
  };

  return (
    <RequireAuth>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <TopBar
          center={
            <input
              className="ftitle"
              style={{ marginLeft: 12, border: 'none', background: 'transparent', outline: 'none', font: 'inherit', color: 'inherit', minWidth: 200 }}
              value={schema?.title ?? ''}
              placeholder={`问卷 ${id}`}
              disabled={loadState !== 'ready'}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="问卷标题"
            />
          }
          actions={
            <>
              {notice && <span style={{ fontSize: 12, color: 'var(--ink-muted)', marginRight: 8 }}>{notice}</span>}
              {renderActions()}
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
              {tab === 'publish' && <Publish id={id!} onPublish={publishFromPage} />}
            </>
          )}
        </div>

        <SaveDialog
          open={saveDialogOpen}
          saving={saving}
          onSave={() => onSave(false)}
          onSaveAndBack={() => onSave(true)}
          onCancel={() => setSaveDialogOpen(false)}
        />
      </div>
    </RequireAuth>
  );
}
