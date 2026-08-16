/**
 * 下拉框题型的 engine 侧行为(非 UI):默认 props、校验、规范化。
 * 与 ./Answer.tsx 及 editors 包的 Editor 一起构成完整的下拉框插件。
 *
 * 单选语义:answer 是 string(选中项 value)。朴素选项 {value,label},额外一个创作期
 * defaultValue(默认选中项)。必答判定走通用层(空串视为未答),本 handler 只判格式/存在。
 */
import type { QuestionTypeHandler, Question, NormalizedRow } from '@xingjuan/engine';

/** 下拉框选项:朴素 value/label(不带图片/样式/填空)。 */
export interface DropdownOption {
  value: string;
  label: string;
}

/** 下拉框题型的 props 结构。核心层不认识它,只有本插件解释。 */
export interface DropdownProps {
  options: DropdownOption[];
  /** 默认选中项 value(创作期设定;作答态初始即选中,可改)。省略则初始为「请选择」。 */
  defaultValue?: string;
  /** 选项随机排序(作答态每份问卷固定一次;编辑预览不洗) */
  randomize?: boolean;
}

function readProps(q: Question): DropdownProps {
  const p = q.props as Partial<DropdownProps>;
  return {
    options: Array.isArray(p.options) ? p.options : [],
    defaultValue: typeof p.defaultValue === 'string' ? p.defaultValue : undefined,
  };
}

export const dropdownHandler: QuestionTypeHandler = {
  type: 'dropdown',
  group: 'choice',
  label: '下拉框',
  defaultProps: (): Record<string, unknown> => ({
    options: [
      { value: 'opt1', label: '选项1' },
      { value: 'opt2', label: '选项2' },
      { value: 'opt3', label: '选项3' },
    ],
  }),
  validate: (question: Question, answer: unknown): string | null => {
    const { options } = readProps(question);
    if (typeof answer !== 'string') return '答案格式应为单个选项';
    // 空串 = 未选;必答判定在通用 validate.ts(与单选一致),此处放行。
    if (answer === '') return null;
    if (!options.some((o) => o.value === answer)) return '所选选项不存在';
    return null;
  },
  normalize: (question: Question, answer: unknown): NormalizedRow[] => {
    if (typeof answer !== 'string' || answer === '') return [];
    return [{ qid: question.id, value: answer }];
  },
  // 逻辑引用:选项作为条件值候选(单选语义,eq/answered)。
  logicRef: (question: Question) => ({
    values: readProps(question).options.map((o) => ({ value: o.value, label: o.label })),
  }),
};
