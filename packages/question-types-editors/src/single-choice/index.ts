/** 单选题编辑器:反向登记编辑描述符到 question-types 的 editorRegistry(仅 studio 调用)。 */
import { registerEditor } from '@xingjuan/question-types';
import { SingleChoiceEditor } from './Editor.js';
import { SingleChoiceCanvas } from './ChoiceCanvasEditor.js';

export function registerSingleChoiceEditor(): void {
  registerEditor('single-choice', {
    Editor: SingleChoiceEditor,
    canvasEditor: SingleChoiceCanvas,
    sections: ['options'],
  });
}
