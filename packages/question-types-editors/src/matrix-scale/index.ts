/** 矩阵量表编辑器:反向登记到 question-types 的 editorRegistry(仅 studio 调用)。 */
import { registerEditor } from '@xingjuan/question-types';
import { MatrixScaleEditor } from './Editor.js';

export function registerMatrixScaleEditor(): void {
  registerEditor('matrix-scale', MatrixScaleEditor);
}
