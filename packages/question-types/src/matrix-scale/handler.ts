/**
 * 矩阵量表(单选)的 engine 侧行为(非 UI):默认 props、校验、规范化。
 *
 * 行为与矩阵单选同构:一题干、多子行、每行在共用列里选一个,答案 { 子行id: 列value }。
 * 区别在编辑体验:列是「量级刻度」,可用「选择量级(3/5/7/10)」快捷初始化默认列(见 Editor)。
 * level 仅记录当前量级预设供 UI 回显,不参与 validate/normalize。
 */
import type { QuestionTypeHandler, Question, NormalizedRow } from '@xingjuan/engine';

/** 矩阵量表的 props 结构。 */
export interface MatrixScaleProps {
  rows: Array<{ id: string; label: string }>;
  /** 量级列(每行共用);value 为刻度标识,label 为量级文案,score 为分值(供均值统计) */
  options: Array<{ value: string; label: string; score?: number }>;
  /** 当前量级预设(3/5/7/10),仅供编辑器回显,非运行期约束 */
  level?: number;
}

export type MatrixScaleAnswer = Record<string, string>;

function readProps(q: Question): MatrixScaleProps {
  const p = q.props as Partial<MatrixScaleProps>;
  return {
    rows: Array.isArray(p.rows) ? p.rows : [],
    options: Array.isArray(p.options) ? p.options : [],
    level: typeof p.level === 'number' ? p.level : undefined,
  };
}

function readAnswer(answer: unknown): MatrixScaleAnswer {
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return {};
  return answer as MatrixScaleAnswer;
}

function answered(v: unknown): boolean {
  return v !== undefined && v !== null && v !== '';
}

export const matrixScaleHandler: QuestionTypeHandler = {
  type: 'matrix-scale',
  group: 'matrix',
  label: '矩阵量表',
  defaultProps: (): Record<string, unknown> => ({
    rows: [
      { id: 'row1', label: '子项1' },
      { id: 'row2', label: '子项2' },
    ],
    // 默认 4 列(分值 1..4)
    options: [
      { value: 's1', label: '很不满意', score: 1 },
      { value: 's2', label: '不满意', score: 2 },
      { value: 's3', label: '满意', score: 3 },
      { value: 's4', label: '很满意', score: 4 },
    ],
    level: 4,
  }),
  validate: (question: Question, answer: unknown): string | null => {
    const { rows, options } = readProps(question);
    const ans = readAnswer(answer);
    const validValues = new Set(options.map((o) => o.value));
    for (const [subId, value] of Object.entries(ans)) {
      if (!answered(value)) continue;
      if (!rows.some((r) => r.id === subId)) return '存在不属于本题的子项';
      if (!validValues.has(value)) return '所选选项不存在';
    }
    if (question.required && !rows.every((r) => answered(ans[r.id]))) return '每个子项都需作答';
    return null;
  },
  normalize: (question: Question, answer: unknown): NormalizedRow[] => {
    const { rows, options } = readProps(question);
    const ans = readAnswer(answer);
    // 每子行一行,value 存该列的分值(number,供均值统计);列无分值时回落列 value 字符串。
    const scoreOf = new Map(options.map((o) => [o.value, o.score]));
    const out: NormalizedRow[] = [];
    for (const r of rows) {
      const v = ans[r.id];
      if (typeof v !== 'string' || v === '') continue;
      const score = scoreOf.get(v);
      out.push({ qid: question.id, subId: r.id, value: typeof score === 'number' ? score : v });
    }
    return out;
  },
  logicRef: (question: Question) => {
    const { rows, options } = readProps(question);
    return {
      subFields: rows.map((r) => ({ id: r.id, label: r.label })),
      values: options.map((o) => ({ value: o.value, label: o.label })),
    };
  },
};
