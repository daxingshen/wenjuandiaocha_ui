/** 矩阵滑动条插件:登记 engine handler(行为)与作答组件。编辑器在 editors 包。 */
import { register } from '@xingjuan/engine';
import { registerAnswer } from '../types.js';
import { matrixSliderHandler } from './handler.js';
import { MatrixSliderAnswerView } from './Answer.js';

export function registerMatrixSlider(): void {
  register(matrixSliderHandler);
  registerAnswer('matrix-slider', MatrixSliderAnswerView);
}

export { matrixSliderHandler } from './handler.js';
export type { MatrixSliderProps, MatrixSliderAnswer } from './handler.js';
