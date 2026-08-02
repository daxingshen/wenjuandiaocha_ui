/**
 * 三栏编辑器 —— 产品心脏。左:题型面板;中:题目画布(拖拽排序);右:选中题设置。
 * 布局用原型 .editor 三栏类(ui/components.css)。
 */
import { QuestionTypePanel } from './QuestionTypePanel.js';
import { Canvas } from './Canvas.js';
import { SettingsPanel } from './SettingsPanel.js';

export function Editor() {
  return (
    <div className="editor">
      <div className="ed-col ed-left">
        <QuestionTypePanel />
      </div>
      <div className="ed-col ed-center">
        <Canvas />
      </div>
      <div className="ed-col ed-right">
        <SettingsPanel />
      </div>
    </div>
  );
}
