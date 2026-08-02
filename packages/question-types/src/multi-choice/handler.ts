/**
 * 多选题的 engine 侧行为(非 UI):默认 props、校验、规范化。
 * 与 ./Answer.tsx ./Editor.tsx 一起构成完整的多选题插件。
 *
 * 答案是 string[](选中的选项 value 数组),normalize 后一个选项一行(约束 4)。
 */
import type { QuestionTypeHandler, Question, NormalizedRow } from '@xingjuan/engine';

/** 多选题的 props 结构。核心层不认识它,只有本插件解释。 */
export interface MultiChoiceProps {
  options: Array<{ value: string; label: string }>;
  /** 最少选项数(含);省略不限 */
  min?: number;
  /** 最多选项数(含);省略不限 */
  max?: number;
  /** 选项随机排序(作答态每份问卷固定一次;编辑预览不洗) */
  randomize?: boolean;
}

function readProps(q: Question): MultiChoiceProps {
  const p = q.props as Partial<MultiChoiceProps>;
  return {
    options: Array.isArray(p.options) ? p.options : [],
    min: typeof p.min === 'number' ? p.min : undefined,
    max: typeof p.max === 'number' ? p.max : undefined,
  };
}

export const multiChoiceHandler: QuestionTypeHandler = {
  type: 'multi-choice',
  group: 'choice',
  label: '多选',
  defaultProps: (): Record<string, unknown> => ({
    options: [
      { value: 'opt1', label: '选项一' },
      { value: 'opt2', label: '选项二' },
      { value: 'opt3', label: '选项三' },
    ],
  }),
  validate: (question: Question, answer: unknown): string | null => {
    const { options, min, max } = readProps(question);
    if (!Array.isArray(answer)) return '答案格式应为选项数组';
    // 必答:空数组在 validate.ts 里会被当成「已答」,故必答的空判断落在此处。
    if (question.required && answer.length === 0) return '此题为必答';
    const valid = new Set(options.map((o) => o.value));
    if (!answer.every((v) => typeof v === 'string' && valid.has(v))) return '包含不存在的选项';
    if (new Set(answer).size !== answer.length) return '选项不可重复';
    if (min !== undefined && answer.length < min) return `至少选择 ${min} 项`;
    if (max !== undefined && answer.length > max) return `最多选择 ${max} 项`;
    return null;
  },
  normalize: (question: Question, answer: unknown): NormalizedRow[] => {
    if (!Array.isArray(answer)) return [];
    // 一个选中项一行;交叉分析/频次统计按 value 聚合。
    const out: NormalizedRow[] = [];
    for (const v of answer) {
      if (typeof v === 'string' && v !== '') out.push({ qid: question.id, value: v });
    }
    return out;
  },
  // 逻辑引用:选项作为条件值候选(多选条件常用 includes)。
  logicRef: (question: Question) => ({
    values: readProps(question).options.map((o) => ({ value: o.value, label: o.label })),
  }),
};
