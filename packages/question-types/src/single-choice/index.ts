/** 单选题插件:把 engine handler 与 UI 组件登记到各自注册表。 */
import { register } from '@xingjuan/engine';
import { registerUI } from '../types.js';
import { singleChoiceHandler } from './handler.js';
import { SingleChoiceAnswer } from './Answer.js';
import { SingleChoiceEditor } from './Editor.js';

export function registerSingleChoice(): void {
  register(singleChoiceHandler);
  registerUI({ type: 'single-choice', Answer: SingleChoiceAnswer, Editor: SingleChoiceEditor });
}

export { singleChoiceHandler } from './handler.js';
export type { SingleChoiceProps } from './handler.js';
