/**
 * 题型 UI 契约。engine 的 QuestionTypeHandler 管非 UI 行为(validate/normalize),
 * 这里补 UI 侧:作答组件与编辑组件。二者靠 type 关联,合成一个完整题型插件。
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

/** 一个完整题型插件 = engine handler(在注册时登记)+ 这两个 React 组件。 */
export interface QuestionTypeUI {
  type: string;
  Answer: ComponentType<AnswerProps>;
  Editor: ComponentType<EditorProps>;
}

const uiRegistry = new Map<string, QuestionTypeUI>();

/** 登记题型的 UI 组件。 */
export function registerUI(ui: QuestionTypeUI): void {
  uiRegistry.set(ui.type, ui);
}

/** 取题型 UI;未注册返回 undefined。 */
export function getUI(type: string): QuestionTypeUI | undefined {
  return uiRegistry.get(type);
}
