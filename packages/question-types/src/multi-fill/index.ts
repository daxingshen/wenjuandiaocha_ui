/** 多项填空插件:登记 engine handler(行为)与作答组件。编辑器在 editors 包。 */
import { register } from '@xingjuan/engine';
import { registerAnswer } from '../types.js';
import { multiFillHandler } from './handler.js';
import { MultiFillAnswerView } from './Answer.js';

export function registerMultiFill(): void {
  register(multiFillHandler);
  registerAnswer('multi-fill', MultiFillAnswerView);
}

export { multiFillHandler } from './handler.js';
export type { MultiFillProps, MultiFillBlank, MultiFillAnswer } from './handler.js';
