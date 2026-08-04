/** 单选题编辑器:反向登记到 question-types 的 editorRegistry(仅 studio 调用)。 */
import { registerEditor } from '@xingjuan/question-types';
import { SingleChoiceEditor } from './Editor.js';

export function registerSingleChoiceEditor(): void {
  registerEditor('single-choice', SingleChoiceEditor);
}
