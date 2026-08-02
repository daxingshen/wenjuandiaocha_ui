/** 多行文本插件:把 engine handler 与 UI 组件登记到各自注册表。 */
import { register } from '@xingjuan/engine';
import { registerUI } from '../types.js';
import { textareaHandler } from './handler.js';
import { TextareaAnswer } from './Answer.js';
import { TextareaEditor } from './Editor.js';

export function registerTextarea(): void {
  register(textareaHandler);
  registerUI({ type: 'textarea', Answer: TextareaAnswer, Editor: TextareaEditor });
}

export { textareaHandler } from './handler.js';
export type { TextareaProps } from './handler.js';
