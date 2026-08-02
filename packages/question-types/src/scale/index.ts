/** 量表题插件:把 engine handler 与 UI 组件登记到各自注册表。 */
import { register } from '@xingjuan/engine';
import { registerUI } from '../types.js';
import { scaleHandler } from './handler.js';
import { ScaleAnswer } from './Answer.js';
import { ScaleEditor } from './Editor.js';

export function registerScale(): void {
  register(scaleHandler);
  registerUI({ type: 'scale', Answer: ScaleAnswer, Editor: ScaleEditor });
}

export { scaleHandler } from './handler.js';
export type { ScaleProps } from './handler.js';
