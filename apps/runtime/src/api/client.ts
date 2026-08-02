/**
 * runtime 专属 HTTP:公开只读加载 schema + 提交答卷。无鉴权(匿名作答,决策 7)。
 * 与 studio 的 client 刻意分开:信任边界与端点不同,不过早共享(见目录设计决策)。
 * 后端栈与 api-contract.md 未定,先占位。
 */
import type { Answers, SurveySchema } from '@xingjuan/engine';

const BASE = import.meta.env.VITE_API_BASE ?? '/api';

/** 按发布 id 拉取问卷 schema(公开只读)。 */
export async function fetchSurvey(id: string): Promise<SurveySchema> {
  const res = await fetch(`${BASE}/public/surveys/${id}`);
  if (!res.ok) throw new Error(`加载问卷失败: ${res.status}`);
  return res.json() as Promise<SurveySchema>;
}

/**
 * 提交答卷。前端已跑 validate/normalize 仅为体验;
 * 后端提交时必须完整重跑校验+normalize,永不信任客户端(决策 6 安全底线)。
 */
export async function submitAnswers(surveyId: string, answers: Answers): Promise<void> {
  const res = await fetch(`${BASE}/public/surveys/${surveyId}/answers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error(`提交失败: ${res.status}`);
}
