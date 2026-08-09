/** 单选题插件:登记 engine handler(行为)与作答组件。编辑器在 editors 包。 */
import { register } from '@xingjuan/engine';
import { registerAnswer } from '../types.js';
import { singleChoiceHandler } from './handler.js';
import { SingleChoiceAnswer } from './Answer.js';

export function registerSingleChoice(): void {
  register(singleChoiceHandler);
  registerAnswer('single-choice', SingleChoiceAnswer);
}

export { singleChoiceHandler } from './handler.js';
export type {
  SingleChoiceProps,
  SingleChoiceOption,
  SingleChoiceArrange,
  SingleChoiceFillAnswer,
} from './handler.js';
