/** 多选题编辑器:反向登记编辑描述符到 question-types 的 editorRegistry(仅 studio 调用)。 */
import { registerEditor } from '@xingjuan/question-types';
import { MultiChoiceEditor } from './Editor.js';
// 画布编辑器与单选同源(选项结构相同),复用 single-choice 目录内的共享组件(比照 matrix-single/shared)。
import { MultiChoiceCanvas } from '../single-choice/ChoiceCanvasEditor.js';

export function registerMultiChoiceEditor(): void {
  registerEditor('multi-choice', {
    Editor: MultiChoiceEditor,
    canvasEditor: MultiChoiceCanvas,
    sections: ['options'],
  });
}
