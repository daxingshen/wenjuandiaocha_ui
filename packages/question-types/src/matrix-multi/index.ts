/** 矩阵多选插件:登记 engine handler(行为)与作答组件。编辑器在 editors 包。 */
import { register } from '@xingjuan/engine';
import { registerAnswer } from '../types.js';
import { matrixMultiHandler } from './handler.js';
import { MatrixMultiAnswerView } from './Answer.js';

export function registerMatrixMulti(): void {
  register(matrixMultiHandler);
  registerAnswer('matrix-multi', MatrixMultiAnswerView);
}

export { matrixMultiHandler } from './handler.js';
export type { MatrixMultiProps, MatrixMultiAnswer } from './handler.js';
