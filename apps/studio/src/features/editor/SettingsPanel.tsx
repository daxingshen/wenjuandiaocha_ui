/**
 * 编辑器右栏:选中题的设置面板。公共字段(题干 + 必答)在此统一管;
 * 题型专属配置委托 getUI(type).Editor 渲染——各题型只管自己的 props(约束 2)。
 * 用原型 .field / .toggle-row / .sw 类。外层 .ed-right 由 Editor 提供。
 */
import { getHandler, listHandlers } from '@xingjuan/engine';
import { getUI } from '@xingjuan/question-types';
import { useEditorStore } from './useEditorStore.js';
import { LogicRules } from './LogicRules.js';

export function SettingsPanel() {
  const schema = useEditorStore((s) => s.schema);
  const selectedQid = useEditorStore((s) => s.selectedQid);
  const updateQuestion = useEditorStore((s) => s.updateQuestion);

  const question = schema?.questions.find((q) => q.id === selectedQid) ?? null;
  if (!question) return <p style={{ color: 'var(--ink-muted)' }}>选中一道题以编辑设置</p>;

  const ui = getUI(question.type);

  // 切换题型:旧 props 对新题型无意义,用新题型的 defaultProps 重置
  const changeType = (type: string) => {
    const handler = getHandler(type);
    if (!handler) return;
    updateQuestion(question.id, { type, props: handler.defaultProps() });
  };

  return (
    <>
      <h4>题目设置</h4>

      <div className="field">
        <label>题型</label>
        <select value={question.type} onChange={(e) => changeType(e.target.value)}>
          {listHandlers().map((h) => (
            <option key={h.type} value={h.type}>{h.label}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>题目标题</label>
        <input
          type="text"
          value={question.title}
          onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
        />
      </div>

      <div className="toggle-row">
        <span>必答题</span>
        <div
          className={`sw${question.required ? ' on' : ''}`}
          onClick={() => updateQuestion(question.id, { required: !question.required })}
        />
      </div>

      {ui ? (
        <div style={{ marginTop: 14 }}>
          <ui.Editor question={question} onChange={(patch) => updateQuestion(question.id, patch)} />
        </div>
      ) : (
        <p style={{ color: 'var(--critical)' }}>题型 {question.type} 无编辑器</p>
      )}

      <h4 style={{ marginTop: 22 }}>逻辑设置</h4>
      <LogicRules schema={schema!} targetQid={question.id} />
    </>
  );
}
