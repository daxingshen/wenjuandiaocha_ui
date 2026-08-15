/**
 * 单选题的 engine 侧行为(非 UI):默认 props、校验、规范化。
 * 与 ./Answer.tsx ./Editor.tsx 一起构成完整的单选题插件。
 */
import type { QuestionTypeHandler, Question, NormalizedRow } from '@xingjuan/engine';

/** 选项排列方式(作答态与预览布局)。 */
export type SingleChoiceArrange = 'vert' | 'horiz' | 'grid';

/** 单个选项。核心配置 value/label,其余为可选装饰/行为,旧问卷无则回落。 */
export interface SingleChoiceOption {
  value: string;
  label: string;
  /** 选项配图:展示在选项下方 */
  image?: { url: string; w: number; h: number };
  /** 选项文字样式;hidden 为真则作答态不渲染该项 */
  style?: { color?: string; fontSize?: number; bold?: boolean; hidden?: boolean };
  /** 允许该选项附自由填空(如「其他」)。选中该项时 answer 变为 { value, text } */
  fill?: { enabled: boolean; desc?: string; placeholder?: string; required?: boolean };
}

/** 单选题的 props 结构。核心层不认识它,只有本插件解释。 */
export interface SingleChoiceProps {
  options: SingleChoiceOption[];
  /** 选项随机排序(作答态每份问卷固定一次;编辑预览不洗) */
  randomize?: boolean;
  /** 选项排列方式;默认竖排 */
  arrange?: SingleChoiceArrange;
}

/** 选中带填空的选项时的答案形状。 */
export interface SingleChoiceFillAnswer {
  value: string;
  text: string;
}

function readProps(q: Question): SingleChoiceProps {
  const opts = (q.props as Partial<SingleChoiceProps>).options;
  return { options: Array.isArray(opts) ? opts : [] };
}

/** 从答案取出选中的选项 value:兼容裸 string 与对象形 { value, text }。 */
function readValue(answer: unknown): string | null {
  if (typeof answer === 'string') return answer;
  if (
    answer !== null &&
    typeof answer === 'object' &&
    !Array.isArray(answer) &&
    typeof (answer as { value?: unknown }).value === 'string'
  ) {
    return (answer as { value: string }).value;
  }
  return null;
}

/** 从对象形答案取出填空文本;裸 string 或无 text 时为 ''。 */
function readText(answer: unknown): string {
  if (
    answer !== null &&
    typeof answer === 'object' &&
    !Array.isArray(answer) &&
    typeof (answer as { text?: unknown }).text === 'string'
  ) {
    return (answer as { text: string }).text;
  }
  return '';
}

export const singleChoiceHandler: QuestionTypeHandler = {
  type: 'single-choice',
  group: 'choice',
  label: '单选',
  defaultProps: (): Record<string, unknown> => ({
    options: [
      { value: 'opt1', label: '选项1' },
      { value: 'opt2', label: '选项2' },
      { value: 'opt3', label: '选项3' },
      { value: 'opt4', label: '选项4' },
    ],
    arrange: 'vert',
  }),
  validate: (question: Question, answer: unknown): string | null => {
    const { options } = readProps(question);
    const value = readValue(answer);
    if (value === null) return '答案格式应为单个选项';
    const opt = options.find((o) => o.value === value);
    if (!opt) return '所选选项不存在';
    // 带填空选项:必填时文本不能为空。空对象 { value:'', ... } 已被上面判为格式错。
    if (opt.fill?.enabled && opt.fill.required && readText(answer).trim() === '') {
      return '请填写补充内容';
    }
    return null;
  },
  normalize: (question: Question, answer: unknown): NormalizedRow[] => {
    const value = readValue(answer);
    if (value === null || value === '') return [];
    const rows: NormalizedRow[] = [{ qid: question.id, value }];
    // 填空文本非空 → 追加一行(subId 'fill'),供统计/导出取原文。
    const text = readText(answer);
    if (text !== '') rows.push({ qid: question.id, subId: 'fill', value: text });
    return rows;
  },
  // 逻辑引用:选项作为条件值候选(条件走下拉而非手打)。
  logicRef: (question: Question) => ({
    values: readProps(question).options.map((o) => ({ value: o.value, label: o.label })),
  }),
};
