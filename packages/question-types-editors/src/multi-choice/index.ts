/** 多选题编辑器:反向登记到 question-types 的 editorRegistry(仅 studio 调用)。 */
import { registerEditor } from '@xingjuan/question-types';
import { MultiChoiceEditor } from './Editor.js';

export function registerMultiChoiceEditor(): void {
  registerEditor('multi-choice', MultiChoiceEditor);
}
