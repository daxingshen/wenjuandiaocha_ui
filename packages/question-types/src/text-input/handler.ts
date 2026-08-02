/**
 * 单项填空的 engine 侧行为(非 UI):默认 props、校验、规范化。
 * 与 ./Answer.tsx ./Editor.tsx 一起构成完整的单项填空插件。
 *
 * 答案是 string(单行)。借本题型让校验层不只有「必答」——支持手机/邮箱格式(PRD §4.2)。
 */
import type { QuestionTypeHandler, Question, NormalizedRow } from '@xingjuan/engine';

/** 填空格式校验类型。 */
export type TextFormat = 'text' | 'email' | 'phone';

/** 单项填空的 props 结构。核心层不认识它,只有本插件解释。 */
export interface TextInputProps {
  /** 格式校验;省略等于 'text'(不校验格式) */
  format?: TextFormat;
  /** 最大长度;省略不限 */
  maxLength?: number;
}

function readProps(q: Question): Required<Pick<TextInputProps, 'format'>> & TextInputProps {
  const p = q.props as Partial<TextInputProps>;
  return {
    format: p.format === 'email' || p.format === 'phone' ? p.format : 'text',
    maxLength: typeof p.maxLength === 'number' ? p.maxLength : undefined,
  };
}

// 邮箱:够用即可(前端体验用,后端权威再校验)。手机:中国大陆 11 位 1 开头。
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^1\d{10}$/;

export const textInputHandler: QuestionTypeHandler = {
  type: 'text-input',
  group: 'text',
  label: '单项填空',
  defaultProps: (): Record<string, unknown> => ({ format: 'text' }),
  validate: (question: Question, answer: unknown): string | null => {
    const { format, maxLength } = readProps(question);
    if (typeof answer !== 'string') return '答案格式应为文本';
    if (maxLength !== undefined && answer.length > maxLength) return `不超过 ${maxLength} 个字符`;
    if (format === 'email' && !EMAIL_RE.test(answer)) return '邮箱格式不正确';
    if (format === 'phone' && !PHONE_RE.test(answer)) return '手机号格式不正确';
    return null;
  },
  normalize: (question: Question, answer: unknown): NormalizedRow[] => {
    if (typeof answer !== 'string' || answer === '') return [];
    return [{ qid: question.id, value: answer }];
  },
};
