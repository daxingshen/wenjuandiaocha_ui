/** 矩阵单选编辑器:反向登记到 question-types 的 editorRegistry(仅 studio 调用)。 */
import { registerEditor } from '@xingjuan/question-types';
import { MatrixSingleEditor } from './Editor.js';

export function registerMatrixSingleEditor(): void {
  registerEditor('matrix-single', MatrixSingleEditor);
}
