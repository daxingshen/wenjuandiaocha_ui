/**
 * 多选题的 engine 侧行为(非 UI):默认 props、校验、规范化。
 * 与 ./Answer.tsx 及 editors 包的 Editor 一起构成完整的多选题插件。
 *
 * 选项结构与单选同源(SingleChoiceOption:含 image/style/fill),创作体验对齐单选。
 * 答案是**混合数组** Array<string | {value,text}>:未填空项是裸 value(string),
 * 允许填空且选中的项是 { value, text }。normalize 后一个选中项一行(约束 4);
 * 填空文本非空时额外追加一行 subId='<optValue>.fill'(区分是哪个选项的填空)。
 */
import type { QuestionTypeHandler, Question, NormalizedRow } from '@xingjuan/engine';
import type { SingleChoiceOption, SingleChoiceArrange } from '../single-choice/handler.js';

/** 多选选项复用单选的富结构(value/label + 可选 image/style/fill)。 */
export type MultiChoiceOption = SingleChoiceOption;

/** 多选答案的单个元素:裸 value,或带填空的 { value, text }。 */
export type MultiChoiceAnswerItem = string | { value: string; text: string };

/** 多选题的 props 结构。核心层不认识它,只有本插件解释。 */
export interface MultiChoiceProps {
  options: MultiChoiceOption[];
  /** 最少选项数(含);省略不限 */
  min?: number;
  /** 最多选项数(含);省略不限 */
  max?: number;
  /** 选项随机排序(作答态每份问卷固定一次;编辑预览不洗) */
  randomize?: boolean;
  /** 选项排列方式;默认竖排 */
  arrange?: SingleChoiceArrange;
}

function readProps(q: Question): MultiChoiceProps {
  const p = q.props as Partial<MultiChoiceProps>;
  return {
    options: Array.isArray(p.options) ? (p.options as MultiChoiceOption[]) : [],
    min: typeof p.min === 'number' ? p.min : undefined,
    max: typeof p.max === 'number' ? p.max : undefined,
  };
}

/** 从混合数组的单个元素取选项 value:兼容裸 string 与对象形 { value, text }。null 表示元素格式非法。 */
function itemValue(item: unknown): string | null {
  if (typeof item === 'string') return item;
  if (
    item !== null &&
    typeof item === 'object' &&
    !Array.isArray(item) &&
    typeof (item as { value?: unknown }).value === 'string'
  ) {
    return (item as { value: string }).value;
  }
  return null;
}

/** 从对象形元素取填空文本;裸 string 或无 text 时为 ''。 */
function itemText(item: unknown): string {
  if (
    item !== null &&
    typeof item === 'object' &&
    !Array.isArray(item) &&
    typeof (item as { text?: unknown }).text === 'string'
  ) {
    return (item as { text: string }).text;
  }
  return '';
}

export const multiChoiceHandler: QuestionTypeHandler = {
  type: 'multi-choice',
  group: 'choice',
  label: '多选',
  defaultProps: (): Record<string, unknown> => ({
    options: [
      { value: 'opt1', label: '选项1' },
      { value: 'opt2', label: '选项2' },
      { value: 'opt3', label: '选项3' },
    ],
    arrange: 'vert',
    // 默认至少选 2 项(至少值下限也是 2,见编辑器);使多选「至少」有意义。
    min: 2,
  }),
  validate: (question: Question, answer: unknown): string | null => {
    const { options, min, max } = readProps(question);
    if (!Array.isArray(answer)) return '答案格式应为选项数组';
    // 必答:空数组在 validate.ts 里会被当成「已答」,故必答的空判断落在此处。
    if (question.required && answer.length === 0) return '此题为必答';
    const byValue = new Map(options.map((o) => [o.value, o]));
    const seen = new Set<string>();
    for (const item of answer) {
      const value = itemValue(item);
      if (value === null) return '包含不存在的选项';
      const opt = byValue.get(value);
      if (!opt) return '包含不存在的选项';
      seen.add(value);
      // 带填空选项:必填时文本不能为空。
      if (opt.fill?.enabled && opt.fill.required && itemText(item).trim() === '') {
        return '请填写补充内容';
      }
    }
    if (seen.size !== answer.length) return '选项不可重复';
    if (min !== undefined && answer.length < min) return `至少选择 ${min} 项`;
    if (max !== undefined && answer.length > max) return `最多选择 ${max} 项`;
    return null;
  },
  normalize: (question: Question, answer: unknown): NormalizedRow[] => {
    if (!Array.isArray(answer)) return [];
    // 一个选中项一行;交叉分析/频次统计按 value 聚合。
    const out: NormalizedRow[] = [];
    for (const item of answer) {
      const value = itemValue(item);
      if (value === null || value === '') continue;
      out.push({ qid: question.id, value });
      // 填空文本非空 → 追加一行(subId '<optValue>.fill'),供统计/导出取原文。
      const text = itemText(item);
      if (text !== '') out.push({ qid: question.id, subId: `${value}.fill`, value: text });
    }
    return out;
  },
  // 逻辑引用:选项作为条件值候选(多选条件常用 includes)。
  logicRef: (question: Question) => ({
    values: readProps(question).options.map((o) => ({ value: o.value, label: o.label })),
  }),
};
