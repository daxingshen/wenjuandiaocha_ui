/** 多选题插件:登记 engine handler(行为)与作答组件。编辑器在 editors 包。 */
import { register } from '@xingjuan/engine';
import { registerAnswer } from '../types.js';
import { multiChoiceHandler } from './handler.js';
import { MultiChoiceAnswer } from './Answer.js';

export function registerMultiChoice(): void {
  register(multiChoiceHandler);
  registerAnswer('multi-choice', MultiChoiceAnswer);
}

export { multiChoiceHandler } from './handler.js';
export type { MultiChoiceProps } from './handler.js';
