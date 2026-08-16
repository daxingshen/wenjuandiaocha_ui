/**
 * 题型 UI 契约 + 两张注册表。engine 的 QuestionTypeHandler 管非 UI 行为(validate/normalize),
 * 这里补 UI 侧,并按「谁需要」拆成两条互不牵连的注册链:
 *
 *   - answerRegistry:作答组件。runtime + studio(预览/画布)都要,由 registerAll() 填。
 *   - editorRegistry:编辑组件。仅 studio 要,由 @xingjuan/question-types-editors 的
 *     registerAllEditors() 填;runtime 从不调用它 → 该表恒空 → editors 包代码不进 runtime 产物。
 *
 * 契约(两张表 + get/register)刻意放在本低层包:studio 的 SettingsPanel 从这里取 getEditor,
 * 不直连 editors 包;editors 包只反向往 editorRegistry 里填。依赖单向:editors → 本包 → engine。
 */
import type { Question } from '@xingjuan/engine';
import type { ComponentType } from 'react';

/** 作答态组件 props(runtime + studio 预览共用)。 */
export interface AnswerProps {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
  /** 是否只读(如已截止) */
  disabled?: boolean;
}

/** 编辑态设置面板组件 props(studio 编辑器右栏用)。 */
export interface EditorProps {
  question: Question;
  onChange: (patch: Partial<Question>) => void;
  /**
   * 右栏分 tab 渲染时的分区提示:
   * - 'type':题型层设置(如排列方式);'options':选项层设置(选项列表/图片/填空/样式)。
   * - 'input':输入项设置(填空题的属性验证/字数/默认值)。
   * - 缺省(undefined):不分区,渲染全部(向后兼容,其余题型编辑器忽略本字段)。
   */
  section?: 'type' | 'options' | 'input';
  /**
   * 当前选中的选项下标(选项级编辑用)。由宿主(studio)提供,与中栏画布内联选中双向同步;
   * 题型编辑器不感知宿主状态来源。undefined 表示宿主未提供选项选中通道(编辑器自理即可)。
   */
  selectedOptIndex?: number | null;
  /** 请求宿主切换选中选项;宿主未提供选项选中通道时可缺省。 */
  onSelectOption?: (index: number | null) => void;
}

// ============ 作答组件注册表(runtime + studio) ============
const answerRegistry = new Map<string, ComponentType<AnswerProps>>();

/** 登记题型的作答组件。 */
export function registerAnswer(type: string, Answer: ComponentType<AnswerProps>): void {
  answerRegistry.set(type, Answer);
}

/** 取题型作答组件;未注册返回 undefined。 */
export function getAnswer(type: string): ComponentType<AnswerProps> | undefined {
  return answerRegistry.get(type);
}

// ============ 编辑组件注册表(仅 studio 会填) ============
const editorRegistry = new Map<string, ComponentType<EditorProps>>();

/** 登记题型的编辑组件。由 editors 包调用;runtime 不调用,故该表在 runtime 侧恒空。 */
export function registerEditor(type: string, Editor: ComponentType<EditorProps>): void {
  editorRegistry.set(type, Editor);
}

/** 取题型编辑组件;未注册(如 runtime,或该题型无编辑器)返回 undefined。 */
export function getEditor(type: string): ComponentType<EditorProps> | undefined {
  return editorRegistry.get(type);
}
