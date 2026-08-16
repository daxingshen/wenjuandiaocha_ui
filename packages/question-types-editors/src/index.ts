/**
 * @xingjuan/question-types-editors — 题型编辑器集合(studio 专属)。
 *
 * registerAllEditors() 一次登记全部题型的编辑组件到 question-types 的 editorRegistry。
 * 仅 studio 启动时调用;runtime 不引入本包 → 编辑器代码与 editor.css 不进作答端产物(物理隔离)。
 *
 * 加题型的编辑器 = 在此 import 并调用其 register 函数,与 question-types 中同名目录一一对应。
 */
import { registerSingleChoiceEditor } from './single-choice/index.js';
import { registerMatrixSingleEditor } from './matrix-single/index.js';
import { registerMatrixMultiEditor } from './matrix-multi/index.js';
import { registerMatrixScaleEditor } from './matrix-scale/index.js';
import { registerMatrixFillEditor } from './matrix-fill/index.js';
import { registerMatrixSliderEditor } from './matrix-slider/index.js';
import { registerMultiChoiceEditor } from './multi-choice/index.js';
import { registerDropdownEditor } from './dropdown/index.js';
import { registerScaleEditor } from './scale/index.js';
import { registerTextInputEditor } from './text-input/index.js';
import { registerTextareaEditor } from './textarea/index.js';

export function registerAllEditors(): void {
  registerSingleChoiceEditor();
  registerMatrixSingleEditor();
  registerMatrixMultiEditor();
  registerMatrixScaleEditor();
  registerMatrixFillEditor();
  registerMatrixSliderEditor();
  registerMultiChoiceEditor();
  registerDropdownEditor();
  registerScaleEditor();
  registerTextInputEditor();
  registerTextareaEditor();
}
