/** 矩阵单选插件:登记 engine handler(行为)与作答组件。编辑器在 editors 包。 */
import { register } from '@xingjuan/engine';
import { registerAnswer } from '../types.js';
import { matrixSingleHandler } from './handler.js';
import { MatrixSingleAnswerView } from './Answer.js';

export function registerMatrixSingle(): void {
  register(matrixSingleHandler);
  registerAnswer('matrix-single', MatrixSingleAnswerView);
}

export { matrixSingleHandler } from './handler.js';
export type { MatrixSingleProps, MatrixSingleAnswer } from './handler.js';
