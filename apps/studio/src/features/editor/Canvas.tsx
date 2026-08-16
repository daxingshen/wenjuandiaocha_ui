/**
 * 编辑器中栏:题目画布。列出当前 schema 的题目。选中题走其题型自带的画布内联编辑组件
 * (getCanvasEditor(type),§20 题型自包含);题型未提供画布编辑组件或未选中时走只读 Answer 预览。
 * 题干在画布内联可编辑(所有题型通用)。题干徽标由题型描述符 canvasBadge 提供(题型无关外壳)。
 * 用原型 .paper / .q-block 类(ui/components.css)。外层 .ed-center 由 Editor 提供。
 *
 * 本文件不含任何具体题型 type 字符串:加题型只在 editors 包声明 canvasEditor/canvasBadge,此处零改。
 */
import { useEffect, useRef } from 'react';
import { getAnswer, getEditor, getCanvasEditor } from '@xingjuan/question-types';
import { useEditorStore } from './useEditorStore.js';

export function Canvas() {
  const schema = useEditorStore((s) => s.schema);
  const selectedQid = useEditorStore((s) => s.selectedQid);
  const setTitle = useEditorStore((s) => s.setTitle);
  const selectQuestion = useEditorStore((s) => s.selectQuestion);
  const moveQuestion = useEditorStore((s) => s.moveQuestion);
  const removeQuestion = useEditorStore((s) => s.removeQuestion);
  const updateQuestion = useEditorStore((s) => s.updateQuestion);
  const selectedOptIndex = useEditorStore((s) => s.selectedOptIndex);
  const selectOption = useEditorStore((s) => s.selectOption);

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
        const CanvasEditor = getCanvasEditor(q.type);
        const badge = getEditor(q.type)?.canvasBadge?.(q) ?? null;
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
              {/* 题干在画布内联可编辑(所有题型通用);点击不冒泡到题选中,聚焦即选中该题。 */}
              <input
                className="q-title-in"
                value={q.title}
                placeholder="未命名题目"
                aria-label={`Q${i + 1} 题目标题`}
                onClick={(e) => e.stopPropagation()}
                onFocus={() => selectQuestion(q.id)}
                onChange={(e) => updateQuestion(q.id, { title: e.target.value })}
              />
              {badge && <span className="fmt-badge">{badge}</span>}
              {hasLogic && <span className="logic-tag">关联逻辑</span>}
            </div>
            {q.hint && <div className="q-hint">{q.hint}</div>}
            {selected && CanvasEditor ? (
              // 选中且题型自带画布内联编辑:走 studio 专属可编辑视图(题型无关地查表)。
              <CanvasEditor
                question={q}
                onChange={(patch) => updateQuestion(q.id, patch)}
                selectedOptIndex={selectedOptIndex}
                onSelectOption={selectOption}
              />
            ) : Answer ? (
              // 未选中,或该题型未提供画布编辑器:只读预览。禁用指针事件,让点击任意处
              // 都落到 q-block 选中该题(否则点在 disabled 表单控件上不冒泡,只能点空白才切换)。
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
