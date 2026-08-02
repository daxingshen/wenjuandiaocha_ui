/**
 * 题型注册表。对应 PRD §9 约束 2(题型 type+props,加题型零 DDL)。
 *
 * 注册表本身框架无关,只登记每种题型的元信息与非 UI 行为(validate/normalize)。
 * 渲染部分(Editor/Answer 组件)由 @xingjuan/question-types 里的 React 组件承载,
 * 通过 renderKey 关联,避免 engine 依赖 React。
 */

import type { Question } from './schema.js';

/** 一道题规范化后的一行(喂统计与交叉分析,约束 4)。 */
export interface NormalizedRow {
  qid: string;
  /** 规范化标量值:选项 value / 数值 / 文本;多选拆多行 */
  value: string | number;
}

/** 题型处理器:非 UI 的行为契约。UI 渲染在 question-types 包用 type 关联。 */
export interface QuestionTypeHandler {
  /** 题型唯一标识,与 Question.type 对应 */
  type: string;
  /** 分组(编辑器左侧题型面板用):choice/text/scale/matrix/advanced */
  group: 'choice' | 'text' | 'scale' | 'matrix' | 'advanced';
  /** 显示名(i18n key 或中文默认) */
  label: string;
  /** 新建该题型时的默认 props */
  defaultProps: () => Record<string, unknown>;
  /** 校验一道题的答案,返回错误信息;null 表示通过 */
  validate: (question: Question, answer: unknown) => string | null;
  /** 规范化答案为若干行(多选→多行,未答→空数组) */
  normalize: (question: Question, answer: unknown) => NormalizedRow[];
}

const handlers = new Map<string, QuestionTypeHandler>();

/** 注册一个题型处理器。重复注册同 type 会覆盖(便于热更新/测试)。 */
export function register(handler: QuestionTypeHandler): void {
  handlers.set(handler.type, handler);
}

/** 取处理器;未注册返回 undefined,由调用方决定回退策略。 */
export function getHandler(type: string): QuestionTypeHandler | undefined {
  return handlers.get(type);
}

/** 列出全部已注册题型(编辑器题型面板用)。 */
export function listHandlers(): QuestionTypeHandler[] {
  return [...handlers.values()];
}

/** 清空注册表(仅测试用)。 */
export function _resetRegistry(): void {
  handlers.clear();
}
