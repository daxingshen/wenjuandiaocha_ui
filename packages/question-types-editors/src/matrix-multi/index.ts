/** 矩阵多选编辑器:反向登记到 question-types 的 editorRegistry(仅 studio 调用)。 */
import { registerEditor } from '@xingjuan/question-types';
import { MatrixMultiEditor } from './Editor.js';

export function registerMatrixMultiEditor(): void {
  registerEditor('matrix-multi', MatrixMultiEditor);
}
