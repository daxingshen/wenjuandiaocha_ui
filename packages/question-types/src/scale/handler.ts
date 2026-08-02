/**
 * 量表题(李克特)的 engine 侧行为(非 UI):默认 props、校验、规范化。
 * 与 ./Answer.tsx ./Editor.tsx 一起构成完整的量表题插件。
 *
 * 答案是 number(整数刻度值),normalize 存数字以喂均值统计(原型 Q2 均值 4.12)。
 */
import type { QuestionTypeHandler, Question, NormalizedRow } from '@xingjuan/engine';

/** 量表题的 props 结构。核心层不认识它,只有本插件解释。 */
export interface ScaleProps {
  /** 刻度下限(含) */
  min: number;
  /** 刻度上限(含) */
  max: number;
  /** 低端锚点文案(如「很不满意」) */
  minLabel?: string;
  /** 高端锚点文案(如「非常满意」) */
  maxLabel?: string;
}

function readProps(q: Question): ScaleProps {
  const p = q.props as Partial<ScaleProps>;
  return {
    min: typeof p.min === 'number' ? p.min : 1,
    max: typeof p.max === 'number' ? p.max : 5,
    minLabel: typeof p.minLabel === 'string' ? p.minLabel : undefined,
    maxLabel: typeof p.maxLabel === 'string' ? p.maxLabel : undefined,
  };
}

export const scaleHandler: QuestionTypeHandler = {
  type: 'scale',
  group: 'scale',
  label: '量表题',
  defaultProps: (): Record<string, unknown> => ({
    min: 1,
    max: 5,
    minLabel: '很不满意',
    maxLabel: '非常满意',
  }),
  validate: (question: Question, answer: unknown): string | null => {
    const { min, max } = readProps(question);
    if (typeof answer !== 'number' || !Number.isInteger(answer)) return '答案应为整数刻度值';
    if (answer < min || answer > max) return `刻度值应在 ${min} 到 ${max} 之间`;
    return null;
  },
  normalize: (question: Question, answer: unknown): NormalizedRow[] => {
    if (typeof answer !== 'number') return [];
    return [{ qid: question.id, value: answer }];
  },
  // 逻辑引用:各刻度值作为条件值候选(量表条件常用 eq/gt/lt)。
  logicRef: (question: Question) => {
    const { min, max } = readProps(question);
    const values: Array<{ value: number; label: string }> = [];
    for (let i = min; i <= max; i++) values.push({ value: i, label: String(i) });
    return { values };
  },
};
