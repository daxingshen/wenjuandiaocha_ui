/**
 * 矩阵填空的 engine 侧行为(非 UI):默认 props、校验、规范化。
 *
 * 「一题干、多子行、每行填一段文本」,无列。答案 { 子行id: string }。
 * normalize 每已答子行一行,value 存文本。maxLength 用 UTF-16 code unit 计数(对齐 text-input)。
 */
import type { QuestionTypeHandler, Question, NormalizedRow } from '@xingjuan/engine';

/** 矩阵填空的 props 结构。 */
export interface MatrixFillProps {
  /** 子行;每行可设独立的输入框提示文案(placeholder) */
  rows: Array<{ id: string; label: string; placeholder?: string }>;
  /** 每行字数上限(UTF-16 计数);省略不限 */
  maxLength?: number;
}

export type MatrixFillAnswer = Record<string, string>;

function readProps(q: Question): MatrixFillProps {
  const p = q.props as Partial<MatrixFillProps>;
  return {
    rows: Array.isArray(p.rows) ? p.rows : [],
    maxLength: typeof p.maxLength === 'number' ? p.maxLength : undefined,
  };
}

function readAnswer(answer: unknown): Record<string, unknown> {
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return {};
  return answer as Record<string, unknown>;
}

export const matrixFillHandler: QuestionTypeHandler = {
  type: 'matrix-fill',
  group: 'matrix',
  label: '矩阵填空',
  defaultProps: (): Record<string, unknown> => ({
    rows: [
      { id: 'row1', label: '子项1' },
      { id: 'row2', label: '子项2' },
    ],
  }),
  validate: (question: Question, answer: unknown): string | null => {
    const { rows, maxLength } = readProps(question);
    const ans = readAnswer(answer);
    const rowIds = new Set(rows.map((r) => r.id));
    for (const [subId, value] of Object.entries(ans)) {
      if (value === undefined || value === null || value === '') continue;
      if (!rowIds.has(subId)) return '存在不属于本题的子项';
      if (typeof value !== 'string') return '答案格式应为文本';
      if (maxLength !== undefined && value.length > maxLength) return `每行不超过 ${maxLength} 个字符`;
    }
    // 必答:每行都要非空。
    if (question.required) {
      const filled = (id: string) => typeof ans[id] === 'string' && (ans[id] as string) !== '';
      if (!rows.every((r) => filled(r.id))) return '每个子项都需作答';
    }
    return null;
  },
  normalize: (question: Question, answer: unknown): NormalizedRow[] => {
    const { rows } = readProps(question);
    const ans = readAnswer(answer);
    const out: NormalizedRow[] = [];
    for (const r of rows) {
      const v = ans[r.id];
      if (typeof v === 'string' && v !== '') out.push({ qid: question.id, subId: r.id, value: v });
    }
    return out;
  },
  // 逻辑引用:子行可作条件源;文本无离散候选值,值走自由输入(不给 values)。
  logicRef: (question: Question) => {
    const { rows } = readProps(question);
    return { subFields: rows.map((r) => ({ id: r.id, label: r.label })) };
  },
};
