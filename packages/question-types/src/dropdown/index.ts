/** 下拉框题型插件:登记 engine handler(行为)与作答组件。编辑器在 editors 包。 */
import { register } from '@xingjuan/engine';
import { registerAnswer } from '../types.js';
import { dropdownHandler } from './handler.js';
import { DropdownAnswer } from './Answer.js';

export function registerDropdown(): void {
  register(dropdownHandler);
  registerAnswer('dropdown', DropdownAnswer);
}

export { dropdownHandler } from './handler.js';
export type { DropdownProps, DropdownOption } from './handler.js';
