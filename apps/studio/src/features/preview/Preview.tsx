/**
 * 预览 · 作答体验测试台(方案 A):设备框内嵌可交互作答(复用 engine + getAnswer,不引 runtime)
 * + 右侧逻辑检查器。schema 取编辑器 store(所见即所得)。提交只跑 validate 给回执,零后端。
 */
import { useMemo, useState } from 'react';
import type { Question } from '@xingjuan/engine';
import { getAnswer } from '@xingjuan/question-types';
import { useEditorStore } from '../editor/useEditorStore.js';
import { derivePreview } from './derive.js';
import { usePreview, runSubmit } from './usePreview.js';
import { DeviceFrame, type Device } from './DeviceFrame.js';
import { Inspector } from './Inspector.js';

/**
 * 逐题预览的「当前题选择」:与 runtime pickCurrent 同语义(命中→原题;失效→就近取原序 ≤ 它的
 * 最后一个可见题;空→null)。runtime 与 studio 是独立 app,无跨 app 依赖,按 derive.ts 复制
 * isAnswered 的先例在此本地复制一份(极小纯逻辑,不引 runtime)。
 */
function pickCurrentLocal<T extends { id: string }>(visible: T[], curId: string | null, orderIds: string[]): T | null {
  if (visible.length === 0) return null;
  const first = visible[0]!;
  if (curId == null) return first;
  const hit = visible.find((q) => q.id === curId);
  if (hit) return hit;
  const curIdx = orderIds.indexOf(curId);
  if (curIdx >= 0) {
    const visibleIds = new Set(visible.map((q) => q.id));
    for (let i = curIdx; i >= 0; i--) {
      const id = orderIds[i]!;
      if (visibleIds.has(id)) return visible.find((q) => q.id === id)!;
    }
  }
  return first;
}

export function Preview() {
  const schema = useEditorStore((s) => s.schema);
  const [device, setDevice] = useState<Device>('desktop');
  // 逐题预览开关:displayMode 是发布页的库级设置,不在草稿 schema 里,预览态无 stats 可读,
  // 故这里用工具栏 toggle 让创建者预览逐题效果(与作答端逐题渲染同一套 pick/翻页语义)。
  const [paged, setPaged] = useState(false);
  const [state, dispatch] = usePreview();
  const { answers, errors, curId } = state;

  // 逻辑显隐/进度是 answers 的纯派生,每次作答重算(schema 可能为空草稿)
  const derived = useMemo(
    () => (schema ? derivePreview(schema, answers) : null),
    [schema, answers],
  );

  if (!schema || !derived) return <p style={{ padding: 24, color: 'var(--ink-muted)' }}>未加载问卷</p>;

  const errorOf = (qid: string) => errors.find((e) => e.qid === qid)?.message;

  // 逐题预览:解出当前题(curId 失效则回落),及首/末判定,用于「上一题/下一题」页脚。
  const orderIds = schema.questions.map((q) => q.id);
  const fallbackId = derived.visible.find((q) => !derived.items.find((it) => it.q.id === q.id)?.isAnswered)?.id
    ?? derived.visible[0]?.id ?? null;
  const cur = paged ? pickCurrentLocal(derived.visible, curId ?? fallbackId, orderIds) : null;
  const curIdx = cur ? derived.visible.findIndex((q) => q.id === cur.id) : -1;

  const onSubmit = () => {
    const r = runSubmit(schema, answers, dispatch);
    if (!r.ok && r.firstErrorQid) {
      document.getElementById(`pv-q-${r.firstErrorQid}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // 单题块渲染(单页/逐题共用):i 为可见序号,用于 Q{i+1} 编号(沿用原口径)。
  const renderQuestion = (q: Question, i: number) => {
    const Answer = getAnswer(q.type);
    const err = errorOf(q.id);
    return (
      <div key={q.id} id={`pv-q-${q.id}`} className="a-q" style={err ? { borderColor: 'var(--critical)' } : undefined}>
        <div className="qt">
          {q.required && <span className="req">* </span>}
          <span className="no">Q{i + 1}</span> {q.title}
        </div>
        {q.hint && <div className="q-hint">{q.hint}</div>}
        {Answer ? (
          <Answer question={q} value={answers[q.id]} onChange={(v) => dispatch({ type: 'setAnswer', qid: q.id, value: v })} />
        ) : (
          <p style={{ color: 'var(--critical)' }}>未知题型:{q.type}</p>
        )}
        {err && <p style={{ color: 'var(--critical)', fontSize: 12, marginTop: 8 }}>{err}</p>}
      </div>
    );
  };

  return (
    <div style={{ padding: '26px 32px 60px' }}>
      <div className="pv-toolbar">
        <div className="pv-seg">
          <button className={device === 'phone' ? 'on' : ''} onClick={() => setDevice('phone')}>📱 手机</button>
          <button className={device === 'desktop' ? 'on' : ''} onClick={() => setDevice('desktop')}>🖥 电脑</button>
        </div>
        <button className="btn sm" onClick={() => dispatch({ type: 'reset' })}>↻ 重新作答</button>
        <div className="pv-seg" style={{ marginLeft: 10 }}>
          <button className={!paged ? 'on' : ''} onClick={() => setPaged(false)}>单页</button>
          <button className={paged ? 'on' : ''} onClick={() => setPaged(true)}>逐题</button>
        </div>
        <div className="grow" />
        <span className="pv-livepill"><i />实时模拟 · 逻辑即时求值</span>
      </div>

      <div className="pv-stage">
        <DeviceFrame device={device} url={`星卷 · survey/${schema.id}`}>
          <div className="a-hero">
            <h2>{schema.title}</h2>
            <p>感谢参与 · 匿名填写</p>
            <div className="a-prog"><i style={{ width: `${derived.pct}%` }} /></div>
            <p style={{ marginTop: 8 }}>已答 {derived.answeredCount} / {derived.requiredTotal} 题</p>
          </div>

          <div className="a-body">
            {/* 单页(默认):渲染全部可见题;逐题:只渲染当前题 cur。共用同一题块渲染。 */}
            {paged
              ? cur && renderQuestion(cur, curIdx)
              : derived.visible.map((q, i) => renderQuestion(q, i))}
          </div>

          {paged ? (
            // 逐题预览页脚:翻页器一行(上一题[首题隐藏] / 下一题[末题禁用不消失]),末题再起一行放提交。
            // 与作答端 Fill 同一布局语义(翻页器稳定 + 提交独立)。翻页不校验(体验测试台)。
            <div className="fill-foot fill-foot-paged">
              <div className="fill-pager">
                {curIdx > 0 && (
                  <button type="button" className="btn" onClick={() => { const p = derived.visible[curIdx - 1]; if (p) dispatch({ type: 'setCurrent', qid: p.id }); }}>← 上一题</button>
                )}
                <div style={{ flex: 1 }} />
                <button type="button" className="btn primary" disabled={curIdx === derived.visible.length - 1} onClick={() => { const n = derived.visible[curIdx + 1]; if (n) dispatch({ type: 'setCurrent', qid: n.id }); }}>下一题 →</button>
              </div>
              {curIdx === derived.visible.length - 1 && (
                <div className="a-submit">
                  <button type="button" className="btn primary" onClick={onSubmit}>提交问卷</button>
                </div>
              )}
            </div>
          ) : (
            <div className="a-submit">
              <button type="button" className="btn primary" onClick={onSubmit}>提交问卷</button>
            </div>
          )}
        </DeviceFrame>

        <Inspector schema={schema} derived={derived} state={state} />
      </div>
    </div>
  );
}
