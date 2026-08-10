/**
 * runtime 专属 HTTP:公开只读加载 schema + 提交答卷。无鉴权(匿名作答,决策 7)。
 * 与 studio 的 client 刻意分开:信任边界与端点不同,不过早共享(见目录设计决策)。
 *
 * 错误一律抛 ApiError(带 status),让 UI 分级处理:
 * 加载 404 → "问卷不存在/未发布/已结束";提交 400 → 后端权威校验错误;429 → 限频;5xx/网络 → 可重试。
 */
import type { Answers, SurveySchema, ValidationError } from '@xingjuan/engine';

const BASE = import.meta.env.VITE_API_BASE ?? '/api';

/** 带 HTTP status 的错误。status=0 表示网络层失败(fetch reject,未拿到响应)。 */
export class ApiError extends Error {
  readonly status: number;
  /** 后端 400 校验失败时带回的逐题错误(对齐 render.go 的 {errors:[...]} 形状)。 */
  readonly validation?: ValidationError[];
  constructor(status: number, message: string, validation?: ValidationError[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.validation = validation;
  }
}

/** 读响应体里的错误信息;后端形状:{error:"…"} 或 {errors:[{qid,message}]}。 */
async function parseError(res: Response): Promise<ApiError> {
  let msg = `请求失败: ${res.status}`;
  let validation: ValidationError[] | undefined;
  try {
    const body = (await res.json()) as { error?: string; errors?: ValidationError[] };
    if (Array.isArray(body.errors)) {
      validation = body.errors;
      msg = body.errors[0]?.message ?? msg;
    } else if (typeof body.error === 'string') {
      msg = body.error;
    }
  } catch {
    // 非 JSON 响应体:保留默认 msg
  }
  return new ApiError(res.status, msg, validation);
}

/** 按发布 id 拉取问卷 schema(公开只读)。失败抛 ApiError(404=不存在/未发布/已结束)。 */
export async function fetchSurvey(id: string): Promise<SurveySchema> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/public/surveys/${id}`);
  } catch {
    throw new ApiError(0, '网络异常,无法加载问卷');
  }
  if (!res.ok) throw await parseError(res);
  return res.json() as Promise<SurveySchema>;
}

/**
 * 提交答卷。前端已跑 validate/normalize 仅为体验;
 * 后端提交时必须完整重跑校验+normalize,永不信任客户端(决策 6 安全底线)。
 * 成功返回后端权威的规范化行数;失败抛 ApiError(400 带 validation,429 限频,5xx 服务端)。
 */
export async function submitAnswers(surveyId: string, version: number, answers: Answers): Promise<{ rows: number }> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/public/surveys/${surveyId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // 带 version(版本锚定):后端按作答者实际看到的这一版取快照校验落库,
      // 消除「作答中所有者重发新版 → 拿没见过的题报必答」死局(见 api-contract §3)。
      body: JSON.stringify({ answers, version }),
    });
  } catch {
    throw new ApiError(0, '网络异常,提交未成功');
  }
  if (!res.ok) throw await parseError(res);
  const body = (await res.json().catch(() => ({}))) as { rows?: number };
  return { rows: typeof body.rows === 'number' ? body.rows : 0 };
}
