/**
 * 分析聚合层。作用在 engine 的规范化行(NormalizedRow,约束 4 双写产物)上,纯函数。
 * 放 studio 不放 engine:统计是 studio 专属(约束 6 统计分离),runtime 不该背统计代码(铁律:保持轻)。
 *
 * 关键:交叉分析要跨答卷关联(同一人 Q1=A 且 Q2=高),而 NormalizedRow 只有 {qid,subId,value},
 * 无答卷身份。故样本单位是「一份答卷 = 一组行」(Respondent),样本是 Respondent[]。
 * 这如实反映约束 4:统计是跨答卷聚合,不是单份行的堆叠。
 */
import {
  getHandler,
  normalizeSurvey,
  type Answers,
  type NormalizedRow,
  type SurveySchema,
} from '@xingjuan/engine';

/** 一份答卷规范化后的行集合。 */
export type Respondent = NormalizedRow[];

/** 某题某值的计数与占比。 */
export interface TallyItem {
  value: string | number;
  count: number;
  pct: number;
}

/** 摊平多份答卷的行(题目统计按值聚合用)。 */
function allRows(sample: Respondent[]): NormalizedRow[] {
  return sample.flatMap((r) => r);
}

/** 匹配某题(可选某子行)的行。 */
function rowsOf(rows: NormalizedRow[], qid: string, subId?: string): NormalizedRow[] {
  return rows.filter((r) => r.qid === qid && (subId === undefined || r.subId === subId));
}

/** 频次统计:某题(可选子行)每个值的计数 + 占比,按计数降序。 */
export function tally(sample: Respondent[], qid: string, subId?: string): TallyItem[] {
  const matched = rowsOf(allRows(sample), qid, subId);
  const counts = new Map<string, { value: string | number; count: number }>();
  for (const r of matched) {
    const key = String(r.value);
    const cur = counts.get(key) ?? { value: r.value, count: 0 };
    cur.count += 1;
    counts.set(key, cur);
  }
  const total = matched.length;
  return [...counts.values()]
    .map((c) => ({ value: c.value, count: c.count, pct: total === 0 ? 0 : c.count / total }))
    .sort((a, b) => b.count - a.count);
}

/** 均值:仅对数值型答案(量表/评分/矩阵子行);无数值行返回 null。 */
export function mean(sample: Respondent[], qid: string, subId?: string): number | null {
  const nums = rowsOf(allRows(sample), qid, subId)
    .map((r) => r.value)
    .filter((v): v is number => typeof v === 'number');
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** 列联表:行题 × 列题,按答卷配对。cells[行值][列值] = 该组合的答卷数。 */
export interface CrossTable {
  rowValues: Array<string | number>;
  colValues: Array<string | number>;
  /** cells.get(行值)?.get(列值) = 计数 */
  cells: Map<string, Map<string, number>>;
  rowTotals: Map<string, number>;
  colTotals: Map<string, number>;
  total: number;
}

/** 取某答卷里某题的单值(交叉分析针对单选/量表这类单值题;多值题取首行)。 */
function singleValue(resp: Respondent, qid: string): string | number | undefined {
  return resp.find((r) => r.qid === qid && r.subId === undefined)?.value;
}

export function crosstab(sample: Respondent[], rowQid: string, colQid: string): CrossTable {
  const cells = new Map<string, Map<string, number>>();
  const rowTotals = new Map<string, number>();
  const colTotals = new Map<string, number>();
  const rowSeen = new Map<string, string | number>();
  const colSeen = new Map<string, string | number>();
  let total = 0;

  for (const resp of sample) {
    const rv = singleValue(resp, rowQid);
    const cv = singleValue(resp, colQid);
    if (rv === undefined || cv === undefined) continue;
    const rk = String(rv);
    const ck = String(cv);
    rowSeen.set(rk, rv);
    colSeen.set(ck, cv);
    const row = cells.get(rk) ?? new Map<string, number>();
    row.set(ck, (row.get(ck) ?? 0) + 1);
    cells.set(rk, row);
    rowTotals.set(rk, (rowTotals.get(rk) ?? 0) + 1);
    colTotals.set(ck, (colTotals.get(ck) ?? 0) + 1);
    total += 1;
  }

  return {
    rowValues: [...rowSeen.values()],
    colValues: [...colSeen.values()],
    cells,
    rowTotals,
    colTotals,
    total,
  };
}

/**
 * 合成样本答卷(演示用,后端未接):按 schema 造 n 份随机答案 → normalizeSurvey。
 * 用 handler.logicRef 读候选值,不 hardcode 题型:有 subFields → 矩阵(每子行随机值),
 * 有 values → 标量(随机取一)。多选/文本无标量候选,本轮演示不产数据(注释标明)。
 */
export function syntheticSample(schema: SurveySchema, n: number): Respondent[] {
  const pick = <T>(arr: T[]): T | undefined => arr[Math.floor(Math.random() * arr.length)];
  const out: Respondent[] = [];
  for (let i = 0; i < n; i++) {
    const answers: Answers = {};
    for (const q of schema.questions) {
      const ref = getHandler(q.type)?.logicRef?.(q);
      if (!ref) continue;
      if (ref.subFields && ref.values) {
        const obj: Record<string, string | number> = {};
        for (const sf of ref.subFields) {
          const v = pick(ref.values);
          if (v) obj[sf.id] = v.value;
        }
        answers[q.id] = obj;
      } else if (ref.values) {
        const v = pick(ref.values);
        if (v) answers[q.id] = v.value;
      }
    }
    out.push(normalizeSurvey(schema, answers));
  }
  return out;
}
