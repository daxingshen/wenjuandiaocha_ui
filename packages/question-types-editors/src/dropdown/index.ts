/** 下拉框编辑器:反向登记到 question-types 的 editorRegistry(仅 studio 调用)。 */
import { registerEditor } from '@xingjuan/question-types';
import { DropdownEditor } from './Editor.js';

export function registerDropdownEditor(): void {
  registerEditor('dropdown', DropdownEditor);
}
