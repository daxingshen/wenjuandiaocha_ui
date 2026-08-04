/** 量表题编辑器:反向登记到 question-types 的 editorRegistry(仅 studio 调用)。 */
import { registerEditor } from '@xingjuan/question-types';
import { ScaleEditor } from './Editor.js';

export function registerScaleEditor(): void {
  registerEditor('scale', ScaleEditor);
}
