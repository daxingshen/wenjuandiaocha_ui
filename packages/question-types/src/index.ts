/**
 * @xingjuan/question-types — 题型插件集合(行为 + 作答UI)。
 *
 * registerAll() 一次登记全部 MVP 题型的 engine handler 与作答组件。runtime / studio
 * 启动时都调它;之后按题目 type 从 engine 注册表(行为)与 getAnswer(作答渲染)取实现。
 *
 * 编辑器不在本包:它是 studio 专属,拆到 @xingjuan/question-types-editors,由 studio 另调
 * registerAllEditors() 登记。runtime 不引 editors 包 → 编辑器代码与 editor.css 不进作答端产物。
 * 加题型 = 在此 import 并调用其 register 函数(编辑器则在 editors 包同名目录补一份)。
 */
import { registerSingleChoice } from './single-choice/index.js';
import { registerMatrixSingle } from './matrix-single/index.js';
import { registerMatrixMulti } from './matrix-multi/index.js';
import { registerMatrixScale } from './matrix-scale/index.js';
import { registerMatrixFill } from './matrix-fill/index.js';
import { registerMatrixSlider } from './matrix-slider/index.js';
import { registerMultiFill } from './multi-fill/index.js';
import { registerMultiChoice } from './multi-choice/index.js';
import { registerDropdown } from './dropdown/index.js';
import { registerScale } from './scale/index.js';
import { registerTextInput } from './text-input/index.js';
import { registerTextarea } from './textarea/index.js';

export function registerAll(): void {
  registerSingleChoice();
  registerMatrixSingle();
  registerMatrixMulti();
  registerMatrixScale();
  registerMatrixFill();
  registerMatrixSlider();
  registerMultiChoice();
  registerDropdown();
  registerScale();
  registerTextInput();
  registerMultiFill();
  registerTextarea();
}

export { getAnswer, registerAnswer, getEditor, registerEditor } from './types.js';
export type { AnswerProps, EditorProps } from './types.js';
export { matrixWrapProps } from './matrix-layout.js';
export type { MatrixLayout, MatrixWrapAttrs } from './matrix-layout.js';

// 文本题共享契约:11 项属性验证 + 通用校验 + 省份名单(填空/多项填空/简答共用)。
export { validateTextValue, normalizeFormat } from './shared/text-format.js';
export type { TextFormat, TextRules } from './shared/text-format.js';
export { PROVINCES, PROVINCE_SET } from './shared/provinces.js';

// 各题型 props 类型:供 editors 包(及其他消费者)标注编辑器,无需深入子路径。
export type {
  SingleChoiceProps,
  SingleChoiceOption,
  SingleChoiceArrange,
  SingleChoiceFillAnswer,
} from './single-choice/index.js';
export type { MatrixSingleProps, MatrixSingleAnswer } from './matrix-single/index.js';
export type { MatrixMultiProps, MatrixMultiAnswer } from './matrix-multi/index.js';
export type { MatrixScaleProps, MatrixScaleAnswer } from './matrix-scale/index.js';
export type { MatrixFillProps, MatrixFillAnswer } from './matrix-fill/index.js';
export type { MultiFillProps, MultiFillBlank, MultiFillAnswer } from './multi-fill/index.js';
export type { MatrixSliderProps, MatrixSliderAnswer } from './matrix-slider/index.js';
export type { MultiChoiceProps, MultiChoiceOption, MultiChoiceAnswerItem } from './multi-choice/index.js';
export type { DropdownProps, DropdownOption } from './dropdown/index.js';
export type { ScaleProps } from './scale/index.js';
export type { TextInputProps } from './text-input/index.js';
export type { TextareaProps } from './textarea/index.js';
