/**
 * 三栏编辑器 —— 产品心脏。左:题型面板;中:题目画布(拖拽排序);右:选中题设置。
 * 骨架:仅摆出三栏布局与子组件插槽,业务在编辑器切片填。
 */
import { QuestionTypePanel } from './QuestionTypePanel.js';
import { Canvas } from './Canvas.js';
import { SettingsPanel } from './SettingsPanel.js';

export function Editor() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr 300px', gap: 16, height: '100%' }}>
      <QuestionTypePanel />
      <Canvas />
      <SettingsPanel />
    </div>
  );
}
