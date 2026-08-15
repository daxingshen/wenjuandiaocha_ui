/**
 * 预览 · 作答体验测试台(方案 A):设备框内嵌可交互作答(复用 engine + getAnswer,不引 runtime)
 * + 右侧逻辑检查器。schema 取编辑器 store(所见即所得)。提交只跑 validate 给回执,零后端。
 */
import { useMemo, useState } from 'react';
import { getAnswer } from '@xingjuan/question-types';
import { useEditorStore } from '../editor/useEditorStore.js';
import { derivePreview } from './derive.js';
import { usePreview, runSubmit } from './usePreview.js';
import { DeviceFrame, type Device } from './DeviceFrame.js';
import { Inspector } from './Inspector.js';

export function Preview() {
  const schema = useEditorStore((s) => s.schema);
  const [device, setDevice] = useState<Device>('phone');
  const [state, dispatch] = usePreview();
  const { answers, errors } = state;

  // 逻辑显隐/进度是 answers 的纯派生,每次作答重算(schema 可能为空草稿)
  const derived = useMemo(
    () => (schema ? derivePreview(schema, answers) : null),
    [schema, answers],
  );

  if (!schema || !derived) return <p style={{ padding: 24, color: 'var(--ink-muted)' }}>未加载问卷</p>;

  const errorOf = (qid: string) => errors.find((e) => e.qid === qid)?.message;

  const onSubmit = () => {
    const r = runSubmit(schema, answers, dispatch);
    if (!r.ok && r.firstErrorQid) {
      document.getElementById(`pv-q-${r.firstErrorQid}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div style={{ padding: '26px 32px 60px' }}>
      <div className="pv-toolbar">
        <div className="pv-seg">
          <button className={device === 'phone' ? 'on' : ''} onClick={() => setDevice('phone')}>📱 手机</button>
          <button className={device === 'desktop' ? 'on' : ''} onClick={() => setDevice('desktop')}>🖥 电脑</button>
        </div>
        <button className="btn sm" onClick={() => dispatch({ type: 'reset' })}>↻ 重新作答</button>
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
            {derived.visible.map((q, i) => {
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
            })}
          </div>

          <div className="a-submit">
            <button type="button" className="btn primary" onClick={onSubmit}>提交问卷</button>
          </div>
        </DeviceFrame>

        <Inspector schema={schema} derived={derived} state={state} />
      </div>
    </div>
  );
}
