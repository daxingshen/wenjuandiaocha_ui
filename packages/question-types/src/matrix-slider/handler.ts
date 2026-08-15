/**
 * 矩阵滑动条的 engine 侧行为(非 UI):默认 props、校验、规范化。
 *
 * 「一题干、多子行、每行拖一个滑块取数值」,无列。答案 { 子行id: number }。
 * 未拖动的行不出现在答案里(必答=每行都须出现)。normalize 每已答子行一行,value 存数字。
 * 不强校验步长整除(原生 range 已按 step 吸附,避免浮点误差误伤)。
 */
import type { QuestionTypeHandler, Question, NormalizedRow } from '@xingjuan/engine';

/** 矩阵滑动条的 props 结构。 */
export interface MatrixSliderProps {
  rows: Array<{ id: string; label: string }>;
  /** 滑块下限(含) */
  min: number;
  /** 滑块上限(含) */
  max: number;
  /** 滑动间隔 */
  step: number;
}

export type MatrixSliderAnswer = Record<string, number>;

function readProps(q: Question): MatrixSliderProps {
  const p = q.props as Partial<MatrixSliderProps>;
  return {
    rows: Array.isArray(p.rows) ? p.rows : [],
    min: typeof p.min === 'number' ? p.min : 0,
    max: typeof p.max === 'number' ? p.max : 100,
    step: typeof p.step === 'number' && p.step > 0 ? p.step : 1,
  };
}

function readAnswer(answer: unknown): Record<string, unknown> {
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return {};
  return answer as Record<string, unknown>;
}

export const matrixSliderHandler: QuestionTypeHandler = {
  type: 'matrix-slider',
  group: 'matrix',
  label: '矩阵滑动条',
  defaultProps: (): Record<string, unknown> => ({
    rows: [
      { id: 'row1', label: '子项1' },
      { id: 'row2', label: '子项2' },
    ],
    min: 0,
    max: 100,
    step: 1,
  }),
  validate: (question: Question, answer: unknown): string | null => {
    const { rows, min, max } = readProps(question);
    const ans = readAnswer(answer);
    const rowIds = new Set(rows.map((r) => r.id));
    for (const [subId, value] of Object.entries(ans)) {
      if (value === undefined || value === null) continue;
      if (!rowIds.has(subId)) return '存在不属于本题的子项';
      if (typeof value !== 'number' || Number.isNaN(value)) return '答案应为数值';
      if (value < min || value > max) return `数值应在 ${min} 到 ${max} 之间`;
    }
    // 必答:每行都须已作答(被拖动过 → 键存在且为数值)。
    if (question.required) {
      const given = (id: string) => typeof ans[id] === 'number' && !Number.isNaN(ans[id] as number);
      if (!rows.every((r) => given(r.id))) return '每个子项都需作答';
    }
    return null;
  },
  normalize: (question: Question, answer: unknown): NormalizedRow[] => {
    const { rows } = readProps(question);
    const ans = readAnswer(answer);
    const out: NormalizedRow[] = [];
    for (const r of rows) {
      const v = ans[r.id];
      if (typeof v === 'number' && !Number.isNaN(v)) out.push({ qid: question.id, subId: r.id, value: v });
    }
    return out;
  },
  // 逻辑引用:子行可作条件源(常用 gt/lt);数值无离散候选,值走自由输入。
  logicRef: (question: Question) => {
    const { rows } = readProps(question);
    return { subFields: rows.map((r) => ({ id: r.id, label: r.label })) };
  },
};
