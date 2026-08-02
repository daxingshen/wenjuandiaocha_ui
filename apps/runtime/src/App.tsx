/**
 * 作答端骨架:演示 engine 完整链路。
 * 加载 schema → 按 type 从注册表取组件渲染 → 逻辑求值隐藏题 → 提交时校验 + normalize。
 * 用一份内联 demo 问卷代替后端接口(业务阶段换成 API 加载)。
 */
import { useMemo, useState } from 'react';
import { evaluate, normalizeSurvey, validateSurvey, type Answers, type SurveySchema } from '@xingjuan/engine';
import { getUI } from '@xingjuan/question-types';

const DEMO: SurveySchema = {
  id: 'demo',
  type: 'survey',
  title: '示例问卷',
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
      type: 'single-choice',
      title: '整体是否满意?',
      required: true,
      props: {
        options: [
          { value: 'good', label: '满意' },
          { value: 'bad', label: '不满意' },
        ],
      },
    },
  ],
  // 逻辑:q1 选“没用过”则隐藏 q2(显隐逻辑,约束 3)
  rules: [
    { id: 'r1', conditions: [{ qid: 'q1', op: 'eq', value: 'no' }], combinator: 'AND', action: { type: 'hide', target: 'q2' } },
  ],
};

export function App() {
  const [answers, setAnswers] = useState<Answers>({});
  const { hidden } = useMemo(() => evaluate(DEMO.rules, answers), [answers]);
  const [submitted, setSubmitted] = useState<string>('');

  const setAnswer = (qid: string, value: unknown) => setAnswers((prev) => ({ ...prev, [qid]: value }));

  const onSubmit = () => {
    const errors = validateSurvey(DEMO, answers);
    if (errors.length > 0) {
      setSubmitted('校验未通过:' + errors.map((e) => `${e.qid} ${e.message}`).join(';'));
      return;
    }
    const rows = normalizeSurvey(DEMO, answers);
    setSubmitted('提交成功。规范化行:' + JSON.stringify(rows));
  };

  return (
    <main style={{ fontFamily: 'var(--font)', maxWidth: 480, margin: '2rem auto', color: 'var(--ink)' }}>
      <h1>{DEMO.title}</h1>
      {DEMO.questions.map((q) => {
        if (hidden.has(q.id)) return null;
        const ui = getUI(q.type);
        if (!ui) return <p key={q.id}>未知题型:{q.type}</p>;
        const Answer = ui.Answer;
        return (
          <div key={q.id} style={{ margin: '1rem 0' }}>
            <Answer question={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
          </div>
        );
      })}
      <button type="button" onClick={onSubmit}>提交</button>
      {submitted && <p style={{ marginTop: '1rem' }}>{submitted}</p>}
    </main>
  );
}
