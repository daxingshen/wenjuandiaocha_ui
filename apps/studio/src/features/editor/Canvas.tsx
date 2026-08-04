/**
 * 编辑器中栏:题目画布。列出当前 schema 的题目,每题用其题型的 Answer(question-types)
 * 做实时预览——与作答端同一份渲染,所见即所得。点击选中高亮,工具条 ↑↓⧉🗑 调 store。
 * 用原型 .paper / .q-block 类(ui/components.css)。外层 .ed-center 由 Editor 提供。
 */
import { getAnswer } from '@xingjuan/question-types';
import { useEditorStore } from './useEditorStore.js';

export function Canvas() {
  const schema = useEditorStore((s) => s.schema);
  const selectedQid = useEditorStore((s) => s.selectedQid);
  const selectQuestion = useEditorStore((s) => s.selectQuestion);
  const moveQuestion = useEditorStore((s) => s.moveQuestion);
  const removeQuestion = useEditorStore((s) => s.removeQuestion);

  if (!schema) return <div className="paper">未加载问卷</div>;

  return (
    <div className="paper">
      <div className="paper-head">
        <h2>{schema.title}</h2>
        <p>点击题目编辑,从左侧题型面板添加新题。</p>
      </div>

      {schema.questions.length === 0 && (
        <div className="add-q">从左侧题型面板点击添加题目</div>
      )}

      {schema.questions.map((q, i) => {
        const Answer = getAnswer(q.type);
        const selected = q.id === selectedQid;
        const hasLogic = schema.rules.some((r) => r.action.target === q.id);
        return (
          <div
            key={q.id}
            className={`q-block${selected ? ' sel' : ''}`}
            onClick={() => selectQuestion(q.id)}
          >
            <div className="q-tools">
              <button type="button" title="上移" onClick={(e) => (e.stopPropagation(), moveQuestion(q.id, -1))}>↑</button>
              <button type="button" title="下移" onClick={(e) => (e.stopPropagation(), moveQuestion(q.id, 1))}>↓</button>
              <button type="button" title="删除" onClick={(e) => (e.stopPropagation(), removeQuestion(q.id))}>🗑</button>
            </div>
            <div className="q-title">
              {q.required && <span className="req">*</span>}
              <span className="no">Q{i + 1}</span>
              <span>{q.title}</span>
              {hasLogic && <span className="logic-tag">关联逻辑</span>}
            </div>
            {Answer ? (
              <Answer question={q} value={undefined} onChange={() => {}} disabled />
            ) : (
              <p style={{ color: 'var(--critical)' }}>题型 {q.type} 未注册</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
