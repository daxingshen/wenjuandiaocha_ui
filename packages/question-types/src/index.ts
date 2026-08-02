/**
 * @xingjuan/question-types — 题型插件集合。
 *
 * registerAll() 一次登记全部 MVP 题型。studio/runtime 启动时调用一次即可,
 * 之后按题目 type 从 engine 注册表(行为)与 getUI(渲染)取到对应实现。
 * 加题型 = 在此 import 并调用其 register 函数,engine/apps 均不改(约束 2)。
 */
import { registerSingleChoice } from './single-choice/index.js';

export function registerAll(): void {
  registerSingleChoice();
}

export { getUI, registerUI } from './types.js';
export type { AnswerProps, EditorProps, QuestionTypeUI } from './types.js';
