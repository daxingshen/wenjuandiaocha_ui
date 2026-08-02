/**
 * 答案规范化。对应 PRD §9 约束 4(答卷双写:完整 JSON + 规范化答案表,每题一行)。
 *
 * 把一份答卷摊平成规范化行,喂统计与交叉分析。多选题一个选项一行。
 * 隐藏题不产出行。委托各题型的 normalize(注册表)。
 */

import { evaluate } from './logic.js';
import { getHandler, type NormalizedRow } from './registry.js';
import type { Answers, SurveySchema } from './schema.js';

/** 把整份答卷规范化为行集合。 */
export function normalizeSurvey(schema: SurveySchema, answers: Answers): NormalizedRow[] {
  const { hidden } = evaluate(schema.rules, answers);
  const rows: NormalizedRow[] = [];
  for (const q of schema.questions) {
    if (hidden.has(q.id)) continue;
    const answer = answers[q.id];
    if (answer === undefined || answer === null || answer === '') continue;
    const handler = getHandler(q.type);
    if (!handler) continue;
    rows.push(...handler.normalize(q, answer));
  }
  return rows;
}
