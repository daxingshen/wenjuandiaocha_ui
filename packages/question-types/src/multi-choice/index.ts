/** 多选题插件:把 engine handler 与 UI 组件登记到各自注册表。 */
import { register } from '@xingjuan/engine';
import { registerUI } from '../types.js';
import { multiChoiceHandler } from './handler.js';
import { MultiChoiceAnswer } from './Answer.js';
import { MultiChoiceEditor } from './Editor.js';

export function registerMultiChoice(): void {
  register(multiChoiceHandler);
  registerUI({ type: 'multi-choice', Answer: MultiChoiceAnswer, Editor: MultiChoiceEditor });
}

export { multiChoiceHandler } from './handler.js';
export type { MultiChoiceProps } from './handler.js';
