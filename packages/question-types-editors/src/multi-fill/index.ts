/** 多项填空编辑器:反向登记编辑描述符到 question-types 的 editorRegistry(仅 studio 调用)。 */
import { registerEditor } from '@xingjuan/question-types';
import { MultiFillEditor } from './Editor.js';
// 画布编辑器三文本题型共用,复用 text-input 目录内的共享组件(每框徽标在其内部渲染)。
import { TextCanvasEditor } from '../text-input/TextCanvasEditor.js';

export function registerMultiFillEditor(): void {
  registerEditor('multi-fill', {
    Editor: MultiFillEditor,
    canvasEditor: TextCanvasEditor,
    sections: ['input'],
  });
}
