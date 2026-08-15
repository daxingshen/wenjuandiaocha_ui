/** 矩阵滑动条编辑器:反向登记到 question-types 的 editorRegistry(仅 studio 调用)。 */
import { registerEditor } from '@xingjuan/question-types';
import { MatrixSliderEditor } from './Editor.js';

export function registerMatrixSliderEditor(): void {
  registerEditor('matrix-slider', MatrixSliderEditor);
}
