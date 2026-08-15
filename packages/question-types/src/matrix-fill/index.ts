/** 矩阵填空插件:登记 engine handler(行为)与作答组件。编辑器在 editors 包。 */
import { register } from '@xingjuan/engine';
import { registerAnswer } from '../types.js';
import { matrixFillHandler } from './handler.js';
import { MatrixFillAnswerView } from './Answer.js';

export function registerMatrixFill(): void {
  register(matrixFillHandler);
  registerAnswer('matrix-fill', MatrixFillAnswerView);
}

export { matrixFillHandler } from './handler.js';
export type { MatrixFillProps, MatrixFillAnswer } from './handler.js';
