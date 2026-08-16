/** 单项填空编辑器:反向登记编辑描述符到 question-types 的 editorRegistry(仅 studio 调用)。 */
import type { Question } from '@xingjuan/engine';
import { registerEditor, normalizeFormat } from '@xingjuan/question-types';
import { TextInputEditor } from './Editor.js';
import { TextCanvasEditor, FORMAT_BADGE } from './TextCanvasEditor.js';

/** 单行填空题干徽标:整题级,读 q.props.format(text/缺省不标)。归并原 studio 两处重复。 */
function textInputBadge(question: Question): string | null {
  const fmt = normalizeFormat((question.props as { format?: string }).format);
  return FORMAT_BADGE[fmt] ?? null;
}

export function registerTextInputEditor(): void {
  registerEditor('text-input', {
    Editor: TextInputEditor,
    canvasEditor: TextCanvasEditor,
    sections: ['input'],
    canvasBadge: textInputBadge,
  });
}
