/**
 * 校验器。对应 PRD §4.2 答题校验(必答、格式、逻辑)。
 *
 * 组合了「隐藏题跳过校验」(逻辑求值结果)与「每题型自己的 validate」(注册表)。
 * 后端提交时必须重跑本流程,永不信任客户端(决策 6 安全底线)。
 */

import { evaluate } from './logic.js';
import { getHandler } from './registry.js';
import type { Answers, SurveySchema } from './schema.js';

/** 单条校验错误。 */
export interface ValidationError {
  qid: string;
  message: string;
}

/**
 * 校验整份答卷。被逻辑隐藏的题跳过校验(隐藏题不该要求作答)。
 * 返回全部错误;空数组表示通过。
 */
export function validateSurvey(schema: SurveySchema, answers: Answers): ValidationError[] {
  const { hidden } = evaluate(schema.rules, answers);
  const errors: ValidationError[] = [];
  for (const q of schema.questions) {
    if (hidden.has(q.id)) continue;
    const answer = answers[q.id];
    const answered = answer !== undefined && answer !== null && answer !== '';

    if (q.required && !answered) {
      errors.push({ qid: q.id, message: '此题为必答' });
      continue;
    }
    if (!answered) continue;

    const handler = getHandler(q.type);
    const msg = handler?.validate(q, answer);
    if (msg) errors.push({ qid: q.id, message: msg });
  }
  return errors;
}
