/** 多行文本编辑器:反向登记到 question-types 的 editorRegistry(仅 studio 调用)。 */
import { registerEditor } from '@xingjuan/question-types';
import { TextareaEditor } from './Editor.js';

export function registerTextareaEditor(): void {
  registerEditor('textarea', TextareaEditor);
}
