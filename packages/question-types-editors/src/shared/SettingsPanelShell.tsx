/**
 * 右栏设置面板外壳(§20 从 studio app 上移进 editors 包,题型自包含的一部分)。
 * 零题型知识:读题型描述符 getEditor(type).sections 装配「中间 tab」,type/logic 由外壳恒定提供。
 * - 题型 tab:公共字段(CommonFields:题型只读锁 + 标题 + 提示 + 必答)+ 题型专属「题型层」(Editor section='type')。
 * - 中间 tab(options/input,由描述符 sections 决定):题型专属设置(Editor section=对应值)。
 * - 逻辑 tab:仅当宿主注入 logicSlot 时出现;外壳不 import LogicRules、不碰 schema.rules——
 *   逻辑是问卷级能力,留在宿主 app(§20 决策 D3)。
 *
 * 宿主契约纯单题:{question, onPatch, selectedOptIndex, onSelectOption, logicSlot, qIndex}——
 * 不含 store 句柄、不含 schema。加题型只在其目录声明 sections,本外壳零改。
 */
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Question } from '@xingjuan/engine';
import { getHandler } from '@xingjuan/engine';
import { getEditor } from '@xingjuan/question-types';
import { CommonFields } from './CommonFields.js';

/** 中间 tab 的中文标签(type/logic 标签在外壳内固定)。 */
const SECTION_LABEL: Record<'options' | 'input', string> = {
  options: '选项',
  input: '输入项',
};

export interface SettingsPanelShellProps {
  /** 当前选中题(宿主解析 schema+selectedQid 后传入,外壳不认识 store/schema)。 */
  question: Question;
  /** 局部更新本题(题干/必答/props);宿主翻译成自己的 store 动作。 */
  onPatch: (patch: Partial<Question>) => void;
  /** 当前选中选项下标(选择题画布↔右栏联动)。 */
  selectedOptIndex?: number | null;
  /** 请求宿主切换选中选项。 */
  onSelectOption?: (index: number | null) => void;
  /** 逻辑 tab 内容(宿主注入 <LogicRules>);缺省则不出现逻辑 tab。 */
  logicSlot?: ReactNode;
  /** 题号(1 基,用于 header「题目设置·Qn」);宿主按 schema 位置算好传入。 */
  qIndex: number;
}

type Tab = 'type' | 'options' | 'input' | 'logic';

export function SettingsPanelShell({
  question,
  onPatch,
  selectedOptIndex,
  onSelectOption,
  logicSlot,
  qIndex,
}: SettingsPanelShellProps) {
  const [tab, setTab] = useState<Tab>('type');

  // 画布点选某个选项时(selectedOptIndex 变为非空),右栏自动切到「选项」tab。
  useEffect(() => {
    if (selectedOptIndex != null) setTab('options');
  }, [selectedOptIndex]);

  const reg = getEditor(question.type);
  const Editor = reg?.Editor;
  const sections = reg?.sections ?? [];
  const middle = sections[0]; // MVP:题型至多一个中间 tab(options 或 input)

  // 切到不属于当前题型的 tab(如切题后残留旧 tab)时,回落到「题型」。
  const validTabs: Tab[] = ['type', ...(middle ? [middle] : []), ...(logicSlot ? ['logic' as const] : [])];
  const activeTab: Tab = validTabs.includes(tab) ? tab : 'type';

  const handlerLabel = getHandler(question.type)?.label ?? question.type;

  return (
    <>
      <h4 title={question.title || undefined}>
        题目设置 · Q{qIndex} <span className="set-q-title">{question.title || '未命名题目'}</span>
      </h4>

      <div className="sub-tabs" id="set-tabs">
        <button className={activeTab === 'type' ? 'active' : ''} onClick={() => setTab('type')}>题型</button>
        {middle && (
          <button className={activeTab === middle ? 'active' : ''} onClick={() => setTab(middle)}>
            {SECTION_LABEL[middle]}
          </button>
        )}
        {logicSlot && (
          <button className={activeTab === 'logic' ? 'active' : ''} onClick={() => setTab('logic')}>逻辑</button>
        )}
      </div>

      {/* Tab 1:题型(公共字段 + 题型层设置;题型创建后锁定不可改) */}
      {activeTab === 'type' && (
        <div className="set-panel" id="sp-qtype">
          <CommonFields question={question} onPatch={onPatch} handlerLabel={handlerLabel} />
          {Editor && (
            <div style={{ marginTop: 14 }}>
              <Editor question={question} onChange={onPatch} section="type" />
            </div>
          )}
        </div>
      )}

      {/* 中间 tab:选项层 / 输入项层设置 */}
      {middle && activeTab === middle && (
        <div className="set-panel" id="sp-middle">
          {Editor ? (
            <Editor
              question={question}
              onChange={onPatch}
              section={middle}
              selectedOptIndex={selectedOptIndex}
              onSelectOption={onSelectOption}
            />
          ) : (
            <p style={{ color: 'var(--ink-muted)' }}>该题型无{SECTION_LABEL[middle]}级设置</p>
          )}
        </div>
      )}

      {/* 逻辑 tab:宿主注入的内容(问卷级能力留 app) */}
      {activeTab === 'logic' && logicSlot && (
        <div className="set-panel" id="sp-logic">
          {logicSlot}
        </div>
      )}
    </>
  );
}
