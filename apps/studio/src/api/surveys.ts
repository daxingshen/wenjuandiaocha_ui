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
  updatedAt: string;
}

export async function listSurveys(): Promise<SurveyListItem[]> {
  throw new Error('未实现:等 api-contract.md 敲定');
}

export async function getSurvey(_id: string): Promise<SurveySchema> {
  throw new Error('未实现:等 api-contract.md 敲定');
}

export async function saveSurvey(_schema: SurveySchema): Promise<void> {
  throw new Error('未实现:等 api-contract.md 敲定');
}
