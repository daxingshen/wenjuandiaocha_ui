/** 矩阵量表插件:登记 engine handler(行为)与作答组件。编辑器在 editors 包。 */
import { register } from '@xingjuan/engine';
import { registerAnswer } from '../types.js';
import { matrixScaleHandler } from './handler.js';
import { MatrixScaleAnswerView } from './Answer.js';

export function registerMatrixScale(): void {
  register(matrixScaleHandler);
  registerAnswer('matrix-scale', MatrixScaleAnswerView);
}

export { matrixScaleHandler } from './handler.js';
export type { MatrixScaleProps, MatrixScaleAnswer } from './handler.js';
