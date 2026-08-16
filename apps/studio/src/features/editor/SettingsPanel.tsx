/**
 * 编辑器右栏:选中题的设置面板。§20 起外壳(tab 机制 + 公共字段)已上移进 @xingjuan/question-types-editors
 * 的 SettingsPanelShell(零题型知识,读题型描述符装配)。本文件退化成薄接线:
 * 解析 store(schema/selectedQid/updateQuestion/选项选中态)→ 传单题 props;逻辑是问卷级能力,
 * 由本 app 注入 <LogicRules> 到 logicSlot(LogicRules 留 app,不进包——决策 D3)。
 * 本文件不含任何具体题型 type 字符串。
 */
import { SettingsPanelShell } from '@xingjuan/question-types-editors';
import { useEditorStore } from './useEditorStore.js';
import { LogicRules } from './LogicRules.js';

export function SettingsPanel() {
  const schema = useEditorStore((s) => s.schema);
  const selectedQid = useEditorStore((s) => s.selectedQid);
  const updateQuestion = useEditorStore((s) => s.updateQuestion);
  const selectedOptIndex = useEditorStore((s) => s.selectedOptIndex);
  const selectOption = useEditorStore((s) => s.selectOption);

  const index = schema?.questions.findIndex((q) => q.id === selectedQid) ?? -1;
  const question = index >= 0 ? schema!.questions[index]! : null;
  if (!question) return <p style={{ color: 'var(--ink-muted)' }}>选中一道题以编辑设置</p>;

  return (
    <SettingsPanelShell
      question={question}
      onPatch={(patch) => updateQuestion(question.id, patch)}
      selectedOptIndex={selectedOptIndex}
      onSelectOption={selectOption}
      qIndex={index + 1}
      logicSlot={<LogicRules schema={schema!} targetQid={question.id} />}
    />
  );
}
