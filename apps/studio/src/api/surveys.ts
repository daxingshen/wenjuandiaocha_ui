/**
 * 问卷 CRUD 端点封装。SurveySchema 类型来自 engine(前后端共享契约那份)。
 * 列表项等 wire DTO 是 studio 专属,定义在此,不进 engine。骨架:签名先定,实现待 api-contract。
 */
import type { SurveySchema } from '@xingjuan/engine';

/** 列表项(轻量,不含题目详情)。 */
export interface SurveyListItem {
  id: string;
  title: string;
  type: SurveySchema['type'];
  /** draft|live|closed */
  status: string;
  updatedAt: string;
}

/** 作答访问模式(对齐后端 domain.AnswerAccess)。 */
export type AnswerAccess = 'anonymous' | 'login_required';

/** 作答呈现形态(对齐后端 domain.DisplayMode)。paged 逐题一页 / single 全部一页(默认)。 */
export type DisplayMode = 'paged' | 'single';

/** 单卷发布态统计(发布回收页用)。回收量来自 responses 计数。 */
export interface SurveyStats {
  /** draft|live|closed */
  status: string;
  /** 已发布版本号;从未发布为 null。 */
  publishedVersion: number | null;
  /** 已回收答卷数。 */
  responseCount: number;
  /** 作答访问模式:anonymous 免登录 / login_required 需登录(发布页回显与切换)。 */
  answerAccess: AnswerAccess;
  /** 作答呈现形态:paged 逐题一页 / single 全部一页(发布页回显与切换)。 */
  displayMode: DisplayMode;
}

import { apiGet, apiSend } from './client.js';

/** offset 翻页一页结果。total 为筛选后总行数,前端据此算总页数。 */
export interface SurveyListPage {
  items: SurveyListItem[];
  total: number;
}

/** 列表查询参数(全部可选)。q 非空即搜索态:后端忽略 page/limit,只返回前 10 条。 */
export interface ListSurveysParams {
  q?: string;
  status?: string;
  type?: string;
  limit?: number;
  page?: number;
}

/**
 * 列出当前用户的问卷(offset 分页)。后端 GET /api/surveys?q=&status=&type=&limit=&page=。
 * 空参数即第一页全量;翻页传 page(1-based)。
 */
export async function listSurveys(params: ListSurveysParams = {}): Promise<SurveyListPage> {
  const sp = new URLSearchParams();
  const q = params.q?.trim();
  if (q) sp.set('q', q);
  if (params.status) sp.set('status', params.status);
  if (params.type) sp.set('type', params.type);
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.page && params.page > 1) sp.set('page', String(params.page));
  const qs = sp.toString();
  return apiGet<SurveyListPage>(`/surveys${qs ? `?${qs}` : ''}`);
}

/**
 * 首存落库:把内存草稿整份 POST 给后端,后端分配并返回 id(不保存则不调用 → 后端零写入)。
 * 之后的保存走 saveSurvey(PUT)。
 */
export async function createSurvey(schema: SurveySchema): Promise<string> {
  const { id } = await apiSend<{ id: string }>('/surveys', 'POST', schema);
  return id;
}

/** 按 id 取草稿 schema(供编辑)。 */
export async function getSurvey(id: string): Promise<SurveySchema> {
  return apiGet<SurveySchema>(`/surveys/${id}`);
}

/** 保存草稿(整份 schema)。 */
export async function saveSurvey(schema: SurveySchema): Promise<void> {
  await apiSend<{ ok: boolean }>(`/surveys/${schema.id}`, 'PUT', schema);
}

/**
 * 发布问卷(草稿 → 版本快照 → live)。返回 { version, unchanged }。
 * unchanged=true:草稿与当前对外版本内容一致,后端未造新版本(重发免空版)。
 */
export async function publishSurvey(id: string): Promise<{ version: number; unchanged: boolean }> {
  const { version, unchanged } = await apiSend<{ ok: boolean; version: number; unchanged: boolean }>(
    `/surveys/${id}/publish`,
    'POST',
  );
  return { version, unchanged };
}

/** 结束回收(live → closed)。仅进行中可结束,否则后端 409。 */
export async function closeSurvey(id: string): Promise<void> {
  await apiSend<{ ok: boolean }>(`/surveys/${id}/close`, 'POST');
}

/** 重新打开(closed → live),复用上次发布的版本快照。仅已结束且曾发布过可重开,否则后端 409。 */
export async function reopenSurvey(id: string): Promise<void> {
  await apiSend<{ ok: boolean }>(`/surveys/${id}/reopen`, 'POST');
}

/** 取单卷发布态统计(status + 已发布版本 + 回收量 + 作答模式)。归属校验,非本人后端 404。 */
export async function getSurveyStats(id: string): Promise<SurveyStats> {
  return apiGet<SurveyStats>(`/surveys/${id}/stats`);
}

/**
 * 设作答访问模式(仅 draft 可改)。后端守卫:非 draft → 409,非 owner → 404,非法值 → 400。
 * 发布不再设定作答模式,故此为唯一写入入口。
 */
export async function setAnswerAccess(id: string, answerAccess: AnswerAccess): Promise<void> {
  await apiSend<null>(`/surveys/${id}/answer-access`, 'PATCH', { answerAccess });
}

/**
 * 设作答呈现形态(仅 draft 可改)。后端守卫同 answer-access:非 draft → 409,非 owner → 404,非法值 → 400。
 * 与作答访问模式并列,发布前定好;发布后锁定。
 */
export async function setDisplayMode(id: string, displayMode: DisplayMode): Promise<void> {
  await apiSend<null>(`/surveys/${id}/display-mode`, 'PATCH', { displayMode });
}
