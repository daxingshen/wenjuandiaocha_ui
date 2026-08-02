/** 矩阵单选插件:把 engine handler 与 UI 组件登记到各自注册表。 */
import { register } from '@xingjuan/engine';
import { registerUI } from '../types.js';
import { matrixSingleHandler } from './handler.js';
import { MatrixSingleAnswerView } from './Answer.js';
import { MatrixSingleEditor } from './Editor.js';

export function registerMatrixSingle(): void {
  register(matrixSingleHandler);
  registerUI({ type: 'matrix-single', Answer: MatrixSingleAnswerView, Editor: MatrixSingleEditor });
}

export { matrixSingleHandler } from './handler.js';
export type { MatrixSingleProps, MatrixSingleAnswer } from './handler.js';
