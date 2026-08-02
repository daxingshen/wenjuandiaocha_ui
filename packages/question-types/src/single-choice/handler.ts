/**
 * 单选题的 engine 侧行为(非 UI):默认 props、校验、规范化。
 * 与 ./Answer.tsx ./Editor.tsx 一起构成完整的单选题插件。
 */
import type { QuestionTypeHandler, Question, NormalizedRow } from '@xingjuan/engine';

/** 单选题的 props 结构。核心层不认识它,只有本插件解释。 */
export interface SingleChoiceProps {
  options: Array<{ value: string; label: string }>;
}

function readProps(q: Question): SingleChoiceProps {
  const opts = (q.props as Partial<SingleChoiceProps>).options;
  return { options: Array.isArray(opts) ? opts : [] };
}

export const singleChoiceHandler: QuestionTypeHandler = {
  type: 'single-choice',
  group: 'choice',
  label: '单选',
  defaultProps: (): Record<string, unknown> => ({
    options: [
      { value: 'opt1', label: '选项一' },
      { value: 'opt2', label: '选项二' },
    ],
  }),
  validate: (question: Question, answer: unknown): string | null => {
    const { options } = readProps(question);
    if (typeof answer !== 'string') return '答案格式应为单个选项';
    return options.some((o) => o.value === answer) ? null : '所选选项不存在';
  },
  normalize: (question: Question, answer: unknown): NormalizedRow[] => {
    if (typeof answer !== 'string' || answer === '') return [];
    return [{ qid: question.id, value: answer }];
  },
};
