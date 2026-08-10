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

/** 单卷发布态统计(发布回收页用)。回收量来自 responses 计数。 */
export interface SurveyStats {
  /** draft|live|closed */
  status: string;
  /** 已发布版本号;从未发布为 null。 */
  publishedVersion: number | null;
  /** 已回收答卷数。 */
  responseCount: number;
}

import { apiGet, apiSend } from './client.js';

/** 列出当前用户的问卷。 */
export async function listSurveys(): Promise<SurveyListItem[]> {
  return apiGet<SurveyListItem[]>('/surveys');
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

/** 发布问卷(草稿 → 版本快照 → live),返回新版本号。 */
export async function publishSurvey(id: string): Promise<number> {
  const { version } = await apiSend<{ ok: boolean; version: number }>(`/surveys/${id}/publish`, 'POST');
  return version;
}

/** 结束回收(live → closed)。仅进行中可结束,否则后端 409。 */
export async function closeSurvey(id: string): Promise<void> {
  await apiSend<{ ok: boolean }>(`/surveys/${id}/close`, 'POST');
}

/** 重新打开(closed → live),复用上次发布的版本快照。仅已结束且曾发布过可重开,否则后端 409。 */
export async function reopenSurvey(id: string): Promise<void> {
  await apiSend<{ ok: boolean }>(`/surveys/${id}/reopen`, 'POST');
}

/** 取单卷发布态统计(status + 已发布版本 + 回收量)。归属校验,非本人后端 404。 */
export async function getSurveyStats(id: string): Promise<SurveyStats> {
  return apiGet<SurveyStats>(`/surveys/${id}/stats`);
}
