/** 矩阵滑动条编辑器:反向登记编辑描述符到 question-types 的 editorRegistry(仅 studio 调用)。 */
import { registerEditor } from '@xingjuan/question-types';
import { MatrixSliderEditor } from './Editor.js';
import { MatrixCanvasEditor } from '../matrix-single/MatrixCanvasEditor.js';

export function registerMatrixSliderEditor(): void {
  registerEditor('matrix-slider', {
    Editor: MatrixSliderEditor,
    canvasEditor: MatrixCanvasEditor,
    sections: ['options'],
  });
}
