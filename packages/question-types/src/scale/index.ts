/** 量表题插件:登记 engine handler(行为)与作答组件。编辑器在 editors 包。 */
import { register } from '@xingjuan/engine';
import { registerAnswer } from '../types.js';
import { scaleHandler } from './handler.js';
import { ScaleAnswer } from './Answer.js';

export function registerScale(): void {
  register(scaleHandler);
  registerAnswer('scale', ScaleAnswer);
}

export { scaleHandler } from './handler.js';
export type { ScaleProps } from './handler.js';
