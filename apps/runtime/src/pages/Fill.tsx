/**
 * 作答页:公开、匿名、极小。engine 完整链路:
 * 渲染未隐藏题 → 实时逻辑求值隐藏 → 提交时 validate(逐题错误)→ normalize → 提交。
 * 用原型 a-hero / a-prog / a-q / a-submit 结构(ui/components.css)。
 *
 * 前端 validate/normalize 仅为体验(即时反馈);后端提交时必须完整重跑,永不信任客户端(决策 6)。
 */
import { useMemo } from 'react';
import { evaluate, normalizeSurvey, validateSurvey, type SurveySchema } from '@xingjuan/engine';
import { getAnswer } from '@xingjuan/question-types';
import { submitAnswers } from '../api/client.js';
import type { FillAction, FillState } from '../useFill.js';

export function Fill({
  schema,
  state,
  dispatch,
}: {
  schema: SurveySchema;
  state: FillState;
  dispatch: React.Dispatch<FillAction>;
}) {
  const { answers, errors } = state;
  // 隐藏题是 answers 的纯派生;每次作答后重算(约束 3:逻辑求值器统一执行)
  const { hidden } = useMemo(() => evaluate(schema.rules, answers), [schema.rules, answers]);
  const errorOf = (qid: string) => errors.find((e) => e.qid === qid)?.message;

  // 进度:已答 / 可见题总数(隐藏题不计)
  const visible = schema.questions.filter((q) => !hidden.has(q.id));
  const answered = visible.filter((q) => {
    const a = answers[q.id];
    return a !== undefined && a !== null && a !== '';
  }).length;
  const pct = visible.length === 0 ? 0 : Math.round((answered / visible.length) * 100);

  const onSubmit = () => {
    const errs = validateSurvey(schema, answers);
    if (errs.length > 0) {
      dispatch({ type: 'showErrors', errors: errs });
      document.getElementById(`q-${errs[0]!.qid}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const rows = normalizeSurvey(schema, answers);
    void submitAnswers(schema.id, answers).catch(() => {});
    dispatch({ type: 'done', rows: rows.length });
  };

  return (
    <main style={{ maxWidth: 480, margin: '0 auto' }}>
      <div className="a-hero">
        <h2>{schema.title}</h2>
        <p>感谢参与 · 匿名填写</p>
        <div className="a-prog"><i style={{ width: `${pct}%` }} /></div>
        <p style={{ marginTop: 8 }}>已完成 {answered} / {visible.length} 题</p>
      </div>

      <div className="a-body">
        {visible.map((q, i) => {
          const Answer = getAnswer(q.type);
          const err = errorOf(q.id);
          return (
            <div key={q.id} id={`q-${q.id}`} className="a-q" style={err ? { borderColor: 'var(--critical)' } : undefined}>
              <div className="qt">
                {q.required && <span className="req">* </span>}
                <span className="no">Q{i + 1}</span> {q.title}
              </div>
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
    </main>
  );
}
