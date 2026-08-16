/**
 * 多行文本的 engine 侧行为(非 UI):默认 props、校验、规范化。
 * 与 ./Answer.tsx ../../editors 的 Editor 一起构成完整的多行文本插件。
 *
 * 答案是 string(多行)。开放文本,统计侧一般走词云/原样导出,normalize 存原文一行。
 * 字数范围(min/maxLength)复用共享 `validateTextValue`(format 恒 text,多行不做属性验证)。
 */
import type { QuestionTypeHandler, Question, NormalizedRow } from '@xingjuan/engine';
import { validateTextValue } from '../shared/text-format.js';

/** 多行文本的 props 结构。核心层不认识它,只有本插件解释。 */
export interface TextareaProps {
  /** 最少字数(UTF-16 计数);省略不限 */
  minLength?: number;
  /** 最大字数(UTF-16 计数);省略不限 */
  maxLength?: number;
  /** 默认值:作答态初始填入,可含换行(纯前端回显,后端不校验) */
  defaultValue?: string;
}

function readProps(q: Question): TextareaProps {
  const p = q.props as Partial<TextareaProps>;
  return {
    minLength: typeof p.minLength === 'number' ? p.minLength : undefined,
    maxLength: typeof p.maxLength === 'number' ? p.maxLength : undefined,
  };
}

export const textareaHandler: QuestionTypeHandler = {
  type: 'textarea',
  group: 'text',
  label: '简答题',
  defaultProps: (): Record<string, unknown> => ({}),
  validate: (question: Question, answer: unknown): string | null => {
    const { minLength, maxLength } = readProps(question);
    return validateTextValue(answer, { format: 'text', minLength, maxLength });
  },
  normalize: (question: Question, answer: unknown): NormalizedRow[] => {
    if (typeof answer !== 'string' || answer === '') return [];
    return [{ qid: question.id, value: answer }];
  },
};
