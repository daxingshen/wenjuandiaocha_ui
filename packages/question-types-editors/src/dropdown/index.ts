/** 下拉框编辑器:反向登记编辑描述符到 question-types 的 editorRegistry(仅 studio 调用)。 */
import { registerEditor } from '@xingjuan/question-types';
import { DropdownEditor } from './Editor.js';
import { DropdownCanvasPreview } from './DropdownCanvasPreview.js';

export function registerDropdownEditor(): void {
  registerEditor('dropdown', {
    Editor: DropdownEditor,
    canvasEditor: DropdownCanvasPreview,
    sections: ['options'],
  });
}
