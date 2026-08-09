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

import { apiGet, apiSend } from './client.js';

/** 列出当前用户的问卷。 */
export async function listSurveys(): Promise<SurveyListItem[]> {
  return apiGet<SurveyListItem[]>('/surveys');
}

/** 新建空问卷,返回其后端生成的 id(方案 A:先建后跳)。 */
export async function createSurvey(): Promise<string> {
  const { id } = await apiSend<{ id: string }>('/surveys', 'POST');
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
