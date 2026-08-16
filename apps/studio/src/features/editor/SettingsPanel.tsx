/**
 * 编辑器右栏:选中题的设置面板。按原型分三 tab —— 题型 / 选项 / 逻辑,一次只看一类(方向 C)。
 * - 题型 tab:公共字段(题型只读锁定 + 题干 + 必答)+ 题型专属「题型层」设置(getEditor section='type')。
 * - 选项 tab:题型专属「选项层」设置(getEditor section='options');题型无此段则提示。
 * - 逻辑 tab:复用现成 <LogicRules>。
 * 题型专属配置委托 getUI(type).Editor 渲染——各题型只管自己的 props(约束 2)。
 */
import { useEffect, useState } from 'react';
import { getHandler } from '@xingjuan/engine';
import { getEditor } from '@xingjuan/question-types';
import { useEditorStore } from './useEditorStore.js';
import { LogicRules } from './LogicRules.js';

type Tab = 'type' | 'options' | 'input' | 'logic';

/** 用「输入项 / 样式」tab 取代「选项」的题型(填空 / 简答 / 多项填空)。 */
const TEXT_TABS = new Set(['text-input', 'textarea', 'multi-fill']);

/** 有「选项层」设置的题型(选项 tab 才渲染专属内容,否则给通用提示)。 */
const HAS_OPTIONS_SECTION = new Set([
  'single-choice',
  'multi-choice',
  'dropdown',
  'matrix-single',
  'matrix-multi',
  'matrix-scale',
  'matrix-fill',
  'matrix-slider',
]);

export function SettingsPanel() {
  const schema = useEditorStore((s) => s.schema);
  const selectedQid = useEditorStore((s) => s.selectedQid);
  const updateQuestion = useEditorStore((s) => s.updateQuestion);
  const selectedOptIndex = useEditorStore((s) => s.selectedOptIndex);
  const selectOption = useEditorStore((s) => s.selectOption);
  const [tab, setTab] = useState<Tab>('type');

  // 画布点选某个选项时(selectedOptIndex 变为非空),右栏自动切到「选项」tab,
  // 并让选项编辑器下拉定位到该项(下拉本身读 selectedOptIndex,故此处只管切 tab)。
  useEffect(() => {
    if (selectedOptIndex !== null) setTab('options');
  }, [selectedOptIndex]);

  const question = schema?.questions.find((q) => q.id === selectedQid) ?? null;
  if (!question) return <p style={{ color: 'var(--ink-muted)' }}>选中一道题以编辑设置</p>;

  const handler = getHandler(question.type);
  const TypeEditor = getEditor(question.type);
  const patch = (p: Parameters<typeof updateQuestion>[1]) => updateQuestion(question.id, p);

  const n = schema!.questions.findIndex((q) => q.id === question.id) + 1;

  const isTextTabs = TEXT_TABS.has(question.type);
  // 切换到不匹配当前题型的 tab(如从填空题的「输入项」切到选择题)时,回落「题型」。
  const activeTab: Tab =
    (isTextTabs && tab === 'options')
      ? 'input'
      : (!isTextTabs && tab === 'input')
        ? 'type'
        : tab;

  return (
    <>
      <h4 title={question.title || undefined}>
        题目设置 · Q{n} <span className="set-q-title">{question.title || '未命名题目'}</span>
      </h4>

      <div className="sub-tabs" id="set-tabs">
        <button className={activeTab === 'type' ? 'active' : ''} onClick={() => setTab('type')}>题型</button>
        {isTextTabs ? (
          <>
            <button className={activeTab === 'input' ? 'active' : ''} onClick={() => setTab('input')}>输入项</button>
            <button className={activeTab === 'logic' ? 'active' : ''} onClick={() => setTab('logic')}>逻辑</button>
          </>
        ) : (
          <>
            <button className={activeTab === 'options' ? 'active' : ''} onClick={() => setTab('options')}>选项</button>
            <button className={activeTab === 'logic' ? 'active' : ''} onClick={() => setTab('logic')}>逻辑</button>
          </>
        )}
      </div>

      {/* Tab 1:题型(整题层设置;题型创建后锁定不可改) */}
      {activeTab === 'type' && (
        <div className="set-panel" id="sp-qtype">
          <div className="field">
            <label>题型</label>
            <div className="ro-field">
              <span>{handler?.label ?? question.type}</span>
              <span className="lock" title="题型创建后不可修改">🔒</span>
            </div>
          </div>

          <div className="field">
            <label>题目标题</label>
            <input type="text" value={question.title} onChange={(e) => patch({ title: e.target.value })} />
          </div>

          <div className="field">
            <label>填写提示</label>
            <input
              type="text"
              placeholder="显示在题干下方,作答者可见(选填)"
              value={question.hint ?? ''}
              onChange={(e) => patch({ hint: e.target.value })}
            />
          </div>

          <div className="toggle-row">
            <span>必答题</span>
            <div
              className={`sw${question.required ? ' on' : ''}`}
              onClick={() => patch({ required: !question.required })}
            />
          </div>

          {TypeEditor && (
            <div style={{ marginTop: 14 }}>
              <TypeEditor question={question} onChange={patch} section="type" />
            </div>
          )}
        </div>
      )}

      {/* Tab 2:选项(选项层设置) */}
      {activeTab === 'options' && (
        <div className="set-panel" id="sp-opt">
          {TypeEditor && HAS_OPTIONS_SECTION.has(question.type) ? (
            <TypeEditor
              question={question}
              onChange={patch}
              section="options"
              selectedOptIndex={selectedOptIndex}
              onSelectOption={selectOption}
            />
          ) : (
            <p style={{ color: 'var(--ink-muted)' }}>该题型无选项级设置</p>
          )}
        </div>
      )}

      {/* Tab(填空题):输入项(属性验证/字数/默认值);多项填空经选中通道操作单框 */}
      {activeTab === 'input' && (
        <div className="set-panel" id="sp-input">
          {TypeEditor ? (
            <TypeEditor
              question={question}
              onChange={patch}
              section="input"
              selectedOptIndex={selectedOptIndex}
              onSelectOption={selectOption}
            />
          ) : (
            <p style={{ color: 'var(--ink-muted)' }}>该题型无输入项设置</p>
          )}
        </div>
      )}

      {/* Tab 3:逻辑 */}
      {activeTab === 'logic' && (
        <div className="set-panel" id="sp-logic">
          <LogicRules schema={schema!} targetQid={question.id} />
        </div>
      )}
    </>
  );
}
