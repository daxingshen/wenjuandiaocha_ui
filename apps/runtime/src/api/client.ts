/**
 * runtime 专属 HTTP:公开只读加载 schema + 提交答卷。无鉴权(匿名作答,决策 7)。
 *
 * 统一响应信封(后端 render.go):业务响应恒 HTTP 200,body = { code, message, data }。
 *   - code=0 成功,data 为负载(schema 对象 / {rows} 等)。
 *   - code!=0 业务错,message 为对外文案;校验失败 code=42201,data.errors 为逐题错误。
 * 框架层失败(限频 429、网络、路由/panic 等)仍走原生非-2xx HTTP 状态,不进信封。
 *
 * 错误一律抛 ApiError(带 code + status),让 UI 分级处理:
 * 加载 code=40401(或原生 404)→ "不存在/未发布/已结束";提交 code=42201 → 逐题校验错;
 * 原生 429 → 限频;5xx/网络 → 可重试。
 */
import type { Answers, SurveySchema, ValidationError } from '@xingjuan/engine';

const BASE = import.meta.env.VITE_API_BASE ?? '/api';

/** 业务错误码(对齐后端 internal/ecode)。0=成功。 */
export const Code = {
  OK: 0,
  BadRequest: 40001,
  Unauthorized: 40101,
  Forbidden: 40301,
  NotFound: 40401,
  Validation: 42201,
  TooManyRequests: 42901,
  Conflict: 40901,
  Internal: 50001,
} as const;

/**
 * 带业务 code 与 HTTP status 的错误。
 * - code:信封业务码(信封化响应);原生非-2xx 时为 undefined。
 * - status:HTTP 状态(原生失败用它分级);信封业务错恒 200。
 * - status=0 表示网络层失败(fetch reject,未拿到响应)。
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: number;
  /** 后端校验失败(code=42201)带回的逐题错误(data.errors)。 */
  readonly validation?: ValidationError[];
  constructor(status: number, message: string, code?: number, validation?: ValidationError[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.validation = validation;
  }

  /** 语义:资源不存在/未发布/已结束(信封 40401 或原生 404)。 */
  get notFound(): boolean {
    return this.code === Code.NotFound || (this.code === undefined && this.status === 404);
  }

  /** 语义:已登录但当前账号无作答权限(如 creator 提交 login_required 问卷,信封 40301)。 */
  get forbidden(): boolean {
    return this.code === Code.Forbidden;
  }

  /** 语义:未登录 / 会话失效(信封 40101 或原生 401)。用于鉴权路径提交时会话过期回退登录闸门。 */
  get unauthorized(): boolean {
    return this.code === Code.Unauthorized || (this.code === undefined && this.status === 401);
  }
}

interface Envelope<T> {
  code: number;
  message: string;
  data: T;
}

/**
 * 统一取响应:
 * - HTTP 非 2xx(框架层失败)→ 抛 ApiError(带原生 status,尝试读旧 {error} 文案)。
 * - HTTP 2xx → 解信封;code!=0 抛 ApiError(带 code + data.errors);code=0 返回 data。
 */
async function take<T>(res: Response, netMsg: string): Promise<T> {
  if (!res.ok) {
    // 框架层失败(限频 429、5xx、路由 404 等):无信封,尽量读 {error} 文案。
    let msg = `请求失败: ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (typeof body.error === 'string') msg = body.error;
    } catch {
      // 非 JSON:保留默认
    }
    throw new ApiError(res.status, msg);
  }
  let env: Envelope<T>;
  try {
    env = (await res.json()) as Envelope<T>;
  } catch {
    throw new ApiError(res.status, netMsg);
  }
  if (env.code !== Code.OK) {
    const validation = (env.data as { errors?: ValidationError[] } | null)?.errors;
    const msg = env.message || validation?.[0]?.message || `请求失败: ${env.code}`;
    throw new ApiError(res.status, msg, env.code, Array.isArray(validation) ? validation : undefined);
  }
  return env.data;
}

/** 作答访问模式(对齐后端 domain.AnswerAccess)。anonymous=免登录;login_required=需登录作答。 */
export type AnswerAccess = 'anonymous' | 'login_required';

/** 公开加载响应:已发布快照 + 作答访问模式。answerAccess 让前端加载即知走匿名/登录路径。 */
export interface PublicSurvey {
  schema: SurveySchema;
  answerAccess: AnswerAccess;
}

/**
 * 按发布 id 拉取已发布快照 + 作答模式(公开只读)。失败抛 ApiError(notFound=不存在/未发布/已结束)。
 * 后端返回 { schema, answerAccess };answerAccess 缺省/未知值按 anonymous 处理(兼容旧后端/历史数据)。
 */
export async function fetchSurvey(id: string): Promise<PublicSurvey> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/public/surveys/${id}`);
  } catch {
    throw new ApiError(0, '网络异常,无法加载问卷');
  }
  const data = await take<{ schema: SurveySchema; answerAccess?: string }>(res, '加载失败,请稍后重试');
  const answerAccess: AnswerAccess = data.answerAccess === 'login_required' ? 'login_required' : 'anonymous';
  return { schema: data.schema, answerAccess };
}

/** 提交函数签名。App 按 answerAccess 注入匿名版或鉴权版,Fill 只调它、不感知登录(方案A·D2)。 */
export type SubmitFn = (surveyId: string, version: number, answers: Answers) => Promise<{ rows: number }>;

/**
 * 提交答卷的共用实现。前端已跑 validate/normalize 仅为体验;
 * 后端提交时必须完整重跑校验+normalize,永不信任客户端(决策 6 安全底线)。
 * 成功返回后端权威的规范化行数;失败抛 ApiError(code=42201 带 validation,原生 429 限频,5xx 服务端)。
 * credentials:鉴权路径带 cookie(session),匿名路径不带。
 */
async function postAnswers(path: string, credentials: RequestCredentials, surveyId: string, version: number, answers: Answers): Promise<{ rows: number }> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials,
      // 带 version(版本锚定):后端按作答者实际看到的这一版取快照校验落库,
      // 消除「作答中所有者重发新版 → 拿没见过的题报必答」死局(见 api-contract §3)。
      body: JSON.stringify({ answers, version }),
    });
  } catch {
    throw new ApiError(0, '网络异常,提交未成功');
  }
  const data = await take<{ rows?: number } | null>(res, '提交未成功,请稍后重试');
  return { rows: typeof data?.rows === 'number' ? data.rows : 0 };
}

/** 匿名提交(anonymous 问卷,走 /public,不带 cookie)。 */
export const submitAnswers: SubmitFn = (surveyId, version, answers) =>
  postAnswers(`/public/surveys/${surveyId}/answers`, 'omit', surveyId, version, answers);

/**
 * 鉴权提交(login_required 问卷,走 /api/surveys/:id/answers,带 session cookie)。
 * 后端校验作答能力位:respondent/admin ✓,creator 被拒(code=40301)。会话失效 → 40101。
 */
export const submitAnswersAuthed: SubmitFn = (surveyId, version, answers) =>
  postAnswers(`/surveys/${surveyId}/answers`, 'include', surveyId, version, answers);
