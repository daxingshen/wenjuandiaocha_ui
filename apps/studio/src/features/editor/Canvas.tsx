/**
 * 编辑器中栏:题目画布。列出当前 schema 的题目,每题用其题型的 Answer(question-types)
 * 做实时预览——与作答端同一份渲染,所见即所得。点击选中高亮,工具条 ↑↓⧉🗑 调 store。
 * 用原型 .paper / .q-block 类(ui/components.css)。外层 .ed-center 由 Editor 提供。
 */
import { useEffect, useRef } from 'react';
import { getAnswer } from '@xingjuan/question-types';
import { useEditorStore } from './useEditorStore.js';
import { SingleChoiceCanvasEditor } from './SingleChoiceCanvasEditor.js';
import { MatrixCanvasEditor } from './MatrixCanvasEditor.js';

/** 有中栏画布内联编辑器的矩阵题型(选中时走可编辑表,而非只读 Answer 预览)。 */
const MATRIX_TYPES = new Set(['matrix-single', 'matrix-multi', 'matrix-scale', 'matrix-fill', 'matrix-slider']);

export function Canvas() {
  const schema = useEditorStore((s) => s.schema);
  const selectedQid = useEditorStore((s) => s.selectedQid);
  const setTitle = useEditorStore((s) => s.setTitle);
  const selectQuestion = useEditorStore((s) => s.selectQuestion);
  const moveQuestion = useEditorStore((s) => s.moveQuestion);
  const removeQuestion = useEditorStore((s) => s.removeQuestion);

  // 新增题目后(题量增加)把新题滚入视野;仅点击切换题目(题量不变)不滚动。
  const prevCount = useRef(schema?.questions.length ?? 0);
  useEffect(() => {
    const count = schema?.questions.length ?? 0;
    if (count > prevCount.current && selectedQid) {
      document.getElementById(`ed-q-${selectedQid}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    prevCount.current = count;
  }, [schema?.questions.length, selectedQid]);

  if (!schema) return <div className="paper">未加载问卷</div>;

  return (
    <div className="paper">
      <div className="paper-head">
        <input
          className="paper-title-in"
          value={schema.title}
          placeholder="未命名问卷"
          aria-label="问卷标题"
          onChange={(e) => setTitle(e.target.value)}
        />
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
            id={`ed-q-${q.id}`}
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
            {q.hint && <div className="q-hint">{q.hint}</div>}
            {q.type === 'single-choice' && selected ? (
              // 选中的单选题:中栏走可内联编辑的选项列表(studio 专属),而非只读预览。
              <SingleChoiceCanvasEditor question={q} />
            ) : MATRIX_TYPES.has(q.type) && selected ? (
              // 选中的矩阵题:中栏走可内联编辑的矩阵表(改行/列标签、增删行列),而非只读预览。
              <MatrixCanvasEditor question={q} />
            ) : Answer ? (
              // 未选中:只读预览。禁用指针事件,让点击任意处都落到 q-block 选中该题
              // (否则点在 disabled 表单控件上不冒泡,只能点空白才切换)。
              <div style={{ pointerEvents: 'none' }}>
                <Answer question={q} value={undefined} onChange={() => {}} disabled />
              </div>
            ) : (
              <p style={{ color: 'var(--critical)' }}>题型 {q.type} 未注册</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
