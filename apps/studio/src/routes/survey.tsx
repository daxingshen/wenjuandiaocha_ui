/**
 * /survey/:id/:tab —— 专注工作区。全局顶栏单行(对齐原型):Logo + 标题 + 状态徽章
 * + 预览/保存/取消编辑。tab 导航条已去除,tab 切换靠路由(看板入口按钮 + URL 直达)。
 *
 * 编辑→Editor(产品心脏);分析→Analysis(占位);预览→复用 getUI().Answer 渲染
 * 编辑器 store 的 schema——studio 不 import runtime,靠共享题型组件(印证内核共享、外壳不同);
 * 发布→占位。schema 现来自编辑器种子;:id 驱动加载与保存待后端 CRUD。
 */
import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { evaluate } from '@xingjuan/engine';
import { getUI } from '@xingjuan/question-types';
import { RequireAuth } from '../features/auth/RequireAuth.js';
import { TopBar } from '../components/TopBar.js';
import { Editor } from '../features/editor/Editor.js';
import { Analysis } from '../features/analysis/Analysis.js';
import { useEditorStore } from '../features/editor/useEditorStore.js';

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
          const ui = getUI(q.type);
          return (
            <div key={q.id} style={{ margin: '12px 0', padding: 16, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12 }}>
              {ui ? <ui.Answer question={q} value={undefined} onChange={() => {}} disabled /> : <p>未知题型:{q.type}</p>}
            </div>
          );
        })}
    </div>
  );
}

export function SurveyRoute() {
  const { id, tab } = useParams<{ id: string; tab: string }>();
  const navigate = useNavigate();

  const isTab = (t: string | undefined): t is TabKey => TABS.some((x) => x.key === t);
  if (!isTab(tab)) return <Navigate to={`/survey/${id}/edit`} replace />;

  return (
    <RequireAuth>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <TopBar
          center={<span className="ftitle" style={{ marginLeft: 12 }}>问卷 {id}</span>}
          actions={
            <>
              <button className="btn sm" onClick={() => navigate(`/survey/${id}/preview`)}>预览</button>
              {/* 保存待后端 saveSurvey 接入(surveys.ts 现 throw);暂占位提示 */}
              <button className="btn primary sm" onClick={() => alert('保存待后端接入')}>保存</button>
              <button className="btn sm" onClick={() => navigate('/home')}>取消编辑</button>
            </>
          }
        />

        <div style={{ flex: 1, overflow: 'auto', background: 'var(--page)' }}>
          {tab === 'edit' && <Editor />}
          {tab === 'preview' && <Preview />}
          {tab === 'analyze' && <Analysis />}
          {tab === 'publish' && <p style={{ color: 'var(--ink-muted)' }}>发布回收(待实现:渠道 / 回收控制 / 二维码)</p>}
        </div>
      </div>
    </RequireAuth>
  );
}
