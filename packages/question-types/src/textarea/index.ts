/** 多行文本插件:登记 engine handler(行为)与作答组件。编辑器在 editors 包。 */
import { register } from '@xingjuan/engine';
import { registerAnswer } from '../types.js';
import { textareaHandler } from './handler.js';
import { TextareaAnswer } from './Answer.js';

export function registerTextarea(): void {
  register(textareaHandler);
  registerAnswer('textarea', TextareaAnswer);
}

export { textareaHandler } from './handler.js';
export type { TextareaProps } from './handler.js';
