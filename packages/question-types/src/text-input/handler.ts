/**
 * 单项填空的 engine 侧行为(非 UI):默认 props、校验、规范化。
 * 与 ./Answer.tsx ../../editors 的 Editor 一起构成完整的单项填空插件。
 *
 * 答案是 string(单行)。属性验证(format)与字数范围(min/maxLength)校验复用共享
 * `validateTextValue`(11 项 format,见 ../shared/text-format.ts),前后端对齐。
 */
import type { QuestionTypeHandler, Question, NormalizedRow } from '@xingjuan/engine';
import { validateTextValue, normalizeFormat, type TextFormat } from '../shared/text-format.js';

/** 单项填空的 props 结构。核心层不认识它,只有本插件解释。 */
export interface TextInputProps {
  /** 属性验证;省略等于 'text'(不校验格式) */
  format?: TextFormat;
  /** 最少字数(UTF-16 计数);省略不限 */
  minLength?: number;
  /** 最大字数(UTF-16 计数);省略不限 */
  maxLength?: number;
  /** 默认值:作答态初始填入(纯前端回显,后端不校验) */
  defaultValue?: string;
}

function readProps(q: Question): TextInputProps {
  const p = q.props as Partial<TextInputProps>;
  return {
    format: normalizeFormat(p.format),
    minLength: typeof p.minLength === 'number' ? p.minLength : undefined,
    maxLength: typeof p.maxLength === 'number' ? p.maxLength : undefined,
  };
}

export const textInputHandler: QuestionTypeHandler = {
  type: 'text-input',
  group: 'text',
  label: '单项填空',
  defaultProps: (): Record<string, unknown> => ({ format: 'text' }),
  validate: (question: Question, answer: unknown): string | null => {
    const { format, minLength, maxLength } = readProps(question);
    return validateTextValue(answer, { format, minLength, maxLength });
  },
  normalize: (question: Question, answer: unknown): NormalizedRow[] => {
    if (typeof answer !== 'string' || answer === '') return [];
    return [{ qid: question.id, value: answer }];
  },
};

// TextFormat 从 shared 再导出,保持 `@xingjuan/question-types` 消费方引用路径不变。
export type { TextFormat } from '../shared/text-format.js';
