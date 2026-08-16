/**
 * 编辑器左栏:题型面板。从 engine.listHandlers() 按 group 分组列出,点击把题型加进画布。
 * 用原型 .qtype 类(ui/components.css)。外层 .ed-left 由 Editor 提供。
 * 加题型零改动:新题型注册后自动出现在这里。
 */
import { listHandlers } from '@xingjuan/engine';
import { useEditorStore } from './useEditorStore.js';

/** group → 中文分组名(对照原型左栏 h4)。 */
const GROUP_LABEL: Record<string, string> = {
  choice: '选择题',
  text: '填空 / 文本',
  scale: '量表 / 评分',
  matrix: '矩阵 / 高级',
  advanced: '高级',
};

/** 题型 → 图标字符(对照原型 qtype .g)。回落取 label 首字。 */
const TYPE_ICON: Record<string, string> = {
  'single-choice': '◉',
  'multi-choice': '☑',
  dropdown: '▾',
  scale: '⇢',
  'text-input': '＿',
  textarea: '¶',
  'matrix-single': '▤',
  'matrix-multi': '▦',
  'matrix-scale': '▧',
  'matrix-fill': '▤',
  'matrix-slider': '⇔',
};

export function QuestionTypePanel() {
  const addQuestion = useEditorStore((s) => s.addQuestion);

  const groups = new Map<string, ReturnType<typeof listHandlers>>();
  for (const h of listHandlers()) {
    const arr = groups.get(h.group) ?? [];
    arr.push(h);
    groups.set(h.group, arr);
  }

  return (
    <>
      {[...groups.entries()].map(([group, handlers]) => (
        <div key={group}>
          <h4>{GROUP_LABEL[group] ?? group}</h4>
          {handlers.map((h) => (
            <button key={h.type} type="button" className="qtype" onClick={() => addQuestion(h.type)}>
              <span className="g">{TYPE_ICON[h.type] ?? h.label[0]}</span>
              <span>{h.label}</span>
            </button>
          ))}
        </div>
      ))}
    </>
  );
}
