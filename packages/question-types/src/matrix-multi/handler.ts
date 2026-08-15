/**
 * 矩阵多选的 engine 侧行为(非 UI):默认 props、校验、规范化。
 *
 * 「一题干、多子行、每行在共用列里可多选」。答案是 { 子行id: 选项value[] } 的对象。
 * min/max 落在「每一行」:每行选中数 ∈ [min,max]。normalize 每行按选中项逐项一行。
 */
import type { QuestionTypeHandler, Question, NormalizedRow } from '@xingjuan/engine';

/** 矩阵多选的 props 结构。 */
export interface MatrixMultiProps {
  rows: Array<{ id: string; label: string }>;
  options: Array<{ value: string; label: string }>;
  /** 每行最少选项数(含);省略不限 */
  min?: number;
  /** 每行最多选项数(含);省略不限 */
  max?: number;
}

/** 矩阵多选的答案:子行 id → 所选列 value 数组。 */
export type MatrixMultiAnswer = Record<string, string[]>;

function readProps(q: Question): MatrixMultiProps {
  const p = q.props as Partial<MatrixMultiProps>;
  return {
    rows: Array.isArray(p.rows) ? p.rows : [],
    options: Array.isArray(p.options) ? p.options : [],
    min: typeof p.min === 'number' ? p.min : undefined,
    max: typeof p.max === 'number' ? p.max : undefined,
  };
}

/** 把未知答案安全读成 { 子行id: value[] } 对象;非对象一律视作空。 */
function readAnswer(answer: unknown): Record<string, unknown> {
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return {};
  return answer as Record<string, unknown>;
}

export const matrixMultiHandler: QuestionTypeHandler = {
  type: 'matrix-multi',
  group: 'matrix',
  label: '矩阵多选',
  defaultProps: (): Record<string, unknown> => ({
    rows: [
      { id: 'row1', label: '子项1' },
      { id: 'row2', label: '子项2' },
    ],
    options: [
      { value: 'opt1', label: '选项1' },
      { value: 'opt2', label: '选项2' },
      { value: 'opt3', label: '选项3' },
      { value: 'opt4', label: '选项4' },
    ],
    min: 2,
  }),
  validate: (question: Question, answer: unknown): string | null => {
    const { rows, options, min, max } = readProps(question);
    const ans = readAnswer(answer);
    const validValues = new Set(options.map((o) => o.value));
    const rowIds = new Set(rows.map((r) => r.id));
    for (const [subId, value] of Object.entries(ans)) {
      if (value === undefined || value === null) continue;
      if (!Array.isArray(value)) return '答案格式应为选项数组';
      if (value.length === 0) continue; // 空行:非必答时跳过 min/max
      if (!rowIds.has(subId)) return '存在不属于本题的子项';
      if (!value.every((v) => typeof v === 'string' && validValues.has(v))) return '包含不存在的选项';
      if (new Set(value).size !== value.length) return '选项不可重复';
      if (min !== undefined && value.length < min) return `每行至少选择 ${min} 项`;
      if (max !== undefined && value.length > max) return `每行最多选择 ${max} 项`;
    }
    // 必答:每行都要有至少一项(空对象/空数组在通用层算已答,故必答判断落此处)。
    if (question.required) {
      const rowAnswered = (id: string) => Array.isArray(ans[id]) && (ans[id] as unknown[]).length > 0;
      if (!rows.every((r) => rowAnswered(r.id))) return '每个子项都需作答';
      // 必答时空行已被上面拦住,但每个已答行仍需满足 min。
      if (min !== undefined) {
        for (const r of rows) {
          if ((ans[r.id] as string[]).length < min) return `每行至少选择 ${min} 项`;
        }
      }
    }
    return null;
  },
  normalize: (question: Question, answer: unknown): NormalizedRow[] => {
    const { rows } = readProps(question);
    const ans = readAnswer(answer);
    // 按 props.rows 顺序遍历,每行的每个选中项一行 { qid, subId, value }。
    const out: NormalizedRow[] = [];
    for (const r of rows) {
      const v = ans[r.id];
      if (!Array.isArray(v)) continue;
      for (const item of v) {
        if (typeof item === 'string' && item !== '') out.push({ qid: question.id, subId: r.id, value: item });
      }
    }
    return out;
  },
  // 逻辑引用:子行 → subId;列 → 条件值(矩阵多选条件常用 includes)。
  logicRef: (question: Question) => {
    const { rows, options } = readProps(question);
    return {
      subFields: rows.map((r) => ({ id: r.id, label: r.label })),
      values: options.map((o) => ({ value: o.value, label: o.label })),
    };
  },
};
