/** 单项填空插件:把 engine handler 与 UI 组件登记到各自注册表。 */
import { register } from '@xingjuan/engine';
import { registerUI } from '../types.js';
import { textInputHandler } from './handler.js';
import { TextInputAnswer } from './Answer.js';
import { TextInputEditor } from './Editor.js';

export function registerTextInput(): void {
  register(textInputHandler);
  registerUI({ type: 'text-input', Answer: TextInputAnswer, Editor: TextInputEditor });
}

export { textInputHandler } from './handler.js';
export type { TextInputProps, TextFormat } from './handler.js';
