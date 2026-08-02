/**
 * 多行文本的 engine 侧行为(非 UI):默认 props、校验、规范化。
 * 与 ./Answer.tsx ./Editor.tsx 一起构成完整的多行文本插件。
 *
 * 答案是 string(多行)。开放文本,统计侧一般走词云/原样导出,normalize 存原文一行。
 */
import type { QuestionTypeHandler, Question, NormalizedRow } from '@xingjuan/engine';

/** 多行文本的 props 结构。核心层不认识它,只有本插件解释。 */
export interface TextareaProps {
  /** 最大长度;省略不限 */
  maxLength?: number;
}

function readProps(q: Question): TextareaProps {
  const p = q.props as Partial<TextareaProps>;
  return { maxLength: typeof p.maxLength === 'number' ? p.maxLength : undefined };
}

export const textareaHandler: QuestionTypeHandler = {
  type: 'textarea',
  group: 'text',
  label: '多行文本',
  defaultProps: (): Record<string, unknown> => ({}),
  validate: (question: Question, answer: unknown): string | null => {
    const { maxLength } = readProps(question);
    if (typeof answer !== 'string') return '答案格式应为文本';
    if (maxLength !== undefined && answer.length > maxLength) return `不超过 ${maxLength} 个字符`;
    return null;
  },
  normalize: (question: Question, answer: unknown): NormalizedRow[] => {
    if (typeof answer !== 'string' || answer === '') return [];
    return [{ qid: question.id, value: answer }];
  },
};
