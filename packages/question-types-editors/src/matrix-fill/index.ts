/** 矩阵填空编辑器:反向登记编辑描述符到 question-types 的 editorRegistry(仅 studio 调用)。 */
import { registerEditor } from '@xingjuan/question-types';
import { MatrixFillEditor } from './Editor.js';
import { MatrixCanvasEditor } from '../matrix-single/MatrixCanvasEditor.js';

export function registerMatrixFillEditor(): void {
  registerEditor('matrix-fill', {
    Editor: MatrixFillEditor,
    canvasEditor: MatrixCanvasEditor,
    sections: ['options'],
  });
}
