/** 单项填空插件:登记 engine handler(行为)与作答组件。编辑器在 editors 包。 */
import { register } from '@xingjuan/engine';
import { registerAnswer } from '../types.js';
import { textInputHandler } from './handler.js';
import { TextInputAnswer } from './Answer.js';

export function registerTextInput(): void {
  register(textInputHandler);
  registerAnswer('text-input', TextInputAnswer);
}

export { textInputHandler } from './handler.js';
export type { TextInputProps, TextFormat } from './handler.js';
