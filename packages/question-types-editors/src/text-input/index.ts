/** 单项填空编辑器:反向登记到 question-types 的 editorRegistry(仅 studio 调用)。 */
import { registerEditor } from '@xingjuan/question-types';
import { TextInputEditor } from './Editor.js';

export function registerTextInputEditor(): void {
  registerEditor('text-input', TextInputEditor);
}
