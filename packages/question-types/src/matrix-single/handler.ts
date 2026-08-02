/**
 * 矩阵单选的 engine 侧行为(非 UI):默认 props、校验、规范化。
 * 与 ./Answer.tsx ./Editor.tsx 一起构成完整的矩阵单选插件。
 *
 * 「一题干、多子行、每行共用一组列(选项)」。它是题型模型的试金石:
 * 答案是 { 子行id: 选项value } 的对象,normalize 后每子行一行 { qid, subId, value }。
 */
import type { QuestionTypeHandler, Question, NormalizedRow } from '@xingjuan/engine';

/** 矩阵单选的 props 结构。核心层不认识它,只有本插件解释。 */
export interface MatrixSingleProps {
  /** 子行(题干的每一行) */
  rows: Array<{ id: string; label: string }>;
  /** 列(每行共用的一组单选项) */
  options: Array<{ value: string; label: string }>;
}

/** 矩阵单选的答案:子行 id → 所选列 value。 */
export type MatrixSingleAnswer = Record<string, string>;

function readProps(q: Question): MatrixSingleProps {
  const p = q.props as Partial<MatrixSingleProps>;
  return {
    rows: Array.isArray(p.rows) ? p.rows : [],
    options: Array.isArray(p.options) ? p.options : [],
  };
}

/** 把未知答案安全读成 { 子行id: value } 对象;非对象一律视作空。 */
function readAnswer(answer: unknown): MatrixSingleAnswer {
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return {};
  return answer as MatrixSingleAnswer;
}

export const matrixSingleHandler: QuestionTypeHandler = {
  type: 'matrix-single',
  group: 'matrix',
  label: '矩阵单选',
  defaultProps: (): Record<string, unknown> => ({
    rows: [
      { id: 'row1', label: '子项一' },
      { id: 'row2', label: '子项二' },
    ],
    options: [
      { value: 'opt1', label: '选项一' },
      { value: 'opt2', label: '选项二' },
    ],
  }),
  validate: (question: Question, answer: unknown): string | null => {
    const { rows, options } = readProps(question);
    const ans = readAnswer(answer);
    const validValues = new Set(options.map((o) => o.value));
    for (const [subId, value] of Object.entries(ans)) {
      if (value === '' || value === undefined || value === null) continue;
      if (!rows.some((r) => r.id === subId)) return '存在不属于本题的子项';
      if (!validValues.has(value)) return '所选选项不存在';
    }
    // 必答:每个子行都要有合法作答
    if (question.required) {
      const answered = (id: string) => ans[id] !== undefined && ans[id] !== null && ans[id] !== '';
      if (!rows.every((r) => answered(r.id))) return '每个子项都需作答';
    }
    return null;
  },
  normalize: (question: Question, answer: unknown): NormalizedRow[] => {
    const { rows } = readProps(question);
    const ans = readAnswer(answer);
    // 每个已答子行产出一行 { qid, subId, value };交叉分析按 (qid, subId) 聚合。
    const out: NormalizedRow[] = [];
    for (const r of rows) {
      const v = ans[r.id];
      if (v === undefined || v === null || v === '') continue;
      out.push({ qid: question.id, subId: r.id, value: v });
    }
    return out;
  },
  // 逻辑引用:子行 → subId 候选;列 → 条件值候选。这是 subId 契约在逻辑 UI 侧的出口。
  logicRef: (question: Question) => {
    const { rows, options } = readProps(question);
    return {
      subFields: rows.map((r) => ({ id: r.id, label: r.label })),
      values: options.map((o) => ({ value: o.value, label: o.label })),
    };
  },
};
