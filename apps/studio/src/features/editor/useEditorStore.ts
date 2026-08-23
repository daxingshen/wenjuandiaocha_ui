/**
 * 编辑器状态(Zustand)。engine 是纯函数,React 只渲染——store 只存 schema 与选中态,
 * 题型专属默认值全走 engine 注册表的 handler.defaultProps(加题型零改动)。
 */
import { create } from 'zustand';
import { getHandler, type LogicRule, type Question, type SurveySchema, type WelcomeContent } from '@xingjuan/engine';

/** 生成问卷内唯一的题目 id。 */
let qseq = 0;
const nextQid = (): string => `q_${Date.now().toString(36)}_${(qseq++).toString(36)}`;
/** 生成规则 id。 */
let rseq = 0;
const nextRid = (): string => `r_${Date.now().toString(36)}_${(rseq++).toString(36)}`;

/** 种子问卷:load 即见内容(对照原型:单选 + 量表)。后端 getSurvey 接通后由其替换。 */
function seedSchema(): SurveySchema {
  return {
    id: 'draft',
    type: 'survey',
    title: '未命名问卷',
    version: 1,
    // 示例欢迎页富内容(dev 开箱见欢迎屏):一段带颜色的欢迎语(Quill HTML)。
    welcome: {
      html: '<p>感谢你抽出 2 分钟填写这份问卷 🙌 <span style="color: #2a78d6;">全程匿名</span>,你的回答只用于产品改进。</p>',
    },
    questions: [
      {
        id: 'seed_1',
        type: 'single-choice',
        title: '您使用我们产品的主要场景是?',
        required: true,
        props: {
          options: [
            { value: 'work', label: '工作办公' },
            { value: 'study', label: '学习教育' },
            { value: 'life', label: '个人生活' },
          ],
        },
      },
      {
        id: 'seed_2',
        type: 'scale',
        title: '您对产品整体的满意程度?',
        required: true,
        props: { min: 1, max: 5, minLabel: '很不满意', maxLabel: '非常满意' },
      },
    ],
    rules: [],
  };
}

export interface EditorState {
  /** 正在编辑的问卷(未加载为 null) */
  schema: SurveySchema | null;
  /** 当前选中的题目 id(决定右栏设置面板渲染谁) */
  selectedQid: string | null;
  /** 当前选中的选项下标(选项级设置用;未选为 null)。切题时重置。 */
  selectedOptIndex: number | null;

  /** 载入一份问卷(种子或后端返回) */
  load: (schema: SurveySchema) => void;
  /** 修改问卷标题 */
  setTitle: (title: string) => void;
  /** 修改欢迎页富内容(HTML 串)。传 undefined 清除 welcome 字段(回落无欢迎内容,向后兼容)。 */
  setWelcome: (welcome: WelcomeContent | undefined) => void;
  /** 追加一道指定题型的新题(props 取该题型 defaultProps),并选中它 */
  addQuestion: (type: string) => void;
  /** 选中某题(重置选项选中) */
  selectQuestion: (qid: string) => void;
  /** 选中某题的某个选项(右栏选项 tab 与中栏内联编辑双向同步);null 清除 */
  selectOption: (index: number | null) => void;
  /** 局部更新某题(题干/必答/props) */
  updateQuestion: (qid: string, patch: Partial<Question>) => void;
  /** 删除某题 */
  removeQuestion: (qid: string) => void;
  /** 上移/下移某题(dir=-1 上,1 下) */
  moveQuestion: (qid: string, dir: -1 | 1) => void;

  /** 新增一条逻辑规则(默认 show,target 指向传入题,空条件组 AND),返回新规则 id */
  addRule: (target: string) => void;
  /** 局部更新某条规则(条件/组合子/动作) */
  updateRule: (rid: string, patch: Partial<Omit<LogicRule, 'id'>>) => void;
  /** 删除某条规则 */
  removeRule: (rid: string) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  schema: seedSchema(),
  selectedQid: 'seed_1',
  selectedOptIndex: null,

  load: (schema) => set({ schema, selectedQid: schema.questions[0]?.id ?? null, selectedOptIndex: null }),

  setTitle: (title) => set((s) => (s.schema ? { schema: { ...s.schema, title } } : s)),

  setWelcome: (welcome) =>
    set((s) => (s.schema ? { schema: { ...s.schema, welcome } } : s)),

  addQuestion: (type) =>
    set((s) => {
      if (!s.schema) return s;
      const handler = getHandler(type);
      if (!handler) return s;
      const q: Question = {
        id: nextQid(),
        type,
        title: handler.label,
        props: handler.defaultProps(),
      };
      return {
        schema: { ...s.schema, questions: [...s.schema.questions, q] },
        selectedQid: q.id,
      };
    }),

  selectQuestion: (qid) => set((s) => (s.selectedQid === qid ? s : { selectedQid: qid, selectedOptIndex: null })),

  selectOption: (index) => set({ selectedOptIndex: index }),

  updateQuestion: (qid, patch) =>
    set((s) => {
      if (!s.schema) return s;
      return {
        schema: {
          ...s.schema,
          questions: s.schema.questions.map((q) => (q.id === qid ? { ...q, ...patch } : q)),
        },
      };
    }),

  removeQuestion: (qid) =>
    set((s) => {
      if (!s.schema) return s;
      const questions = s.schema.questions.filter((q) => q.id !== qid);
      return {
        schema: { ...s.schema, questions },
        selectedQid: s.selectedQid === qid ? (questions[0]?.id ?? null) : s.selectedQid,
      };
    }),

  moveQuestion: (qid, dir) =>
    set((s) => {
      if (!s.schema) return s;
      const qs = [...s.schema.questions];
      const i = qs.findIndex((q) => q.id === qid);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= qs.length) return s;
      [qs[i], qs[j]] = [qs[j]!, qs[i]!];
      return { schema: { ...s.schema, questions: qs } };
    }),

  addRule: (target) =>
    set((s) => {
      if (!s.schema) return s;
      const rule: LogicRule = {
        id: nextRid(),
        conditions: [],
        combinator: 'AND',
        action: { type: 'show', target },
      };
      return { schema: { ...s.schema, rules: [...s.schema.rules, rule] } };
    }),

  updateRule: (rid, patch) =>
    set((s) => {
      if (!s.schema) return s;
      return {
        schema: {
          ...s.schema,
          rules: s.schema.rules.map((r) => (r.id === rid ? { ...r, ...patch } : r)),
        },
      };
    }),

  removeRule: (rid) =>
    set((s) => {
      if (!s.schema) return s;
      return { schema: { ...s.schema, rules: s.schema.rules.filter((r) => r.id !== rid) } };
    }),
}));
