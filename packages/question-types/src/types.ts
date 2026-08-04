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
