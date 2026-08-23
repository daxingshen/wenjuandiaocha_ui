/**
 * 问卷 / 题目 / 逻辑规则的类型定义 + 版本模型。
 * 对应 PRD §9 约束 1(类型是字段)、2(题型 type+props)、5(schema 版本隔离)。
 *
 * 这些类型是**前后端共享契约**的前端侧声明。逻辑规则(LogicRule)是纯数据,
 * 前后端各自实现求值器,靠 golden.test.ts 里的向量锁行为一致(决策 6)。
 */

/** 问卷形态。类型是一个字段,不是六套系统(约束 1)。 */
export type SurveyType =
  | 'survey' // 问卷调查(MVP 唯一实现的形态)
  | 'exam' // 在线考试
  | 'vote' // 投票评选
  | 'signup' // 报名表单
  | 'assess' // 心理测评
  | 'review360'; // 360 评估

/** 一道题。核心不认识具体题型,题型细节全在 props(约束 2)。 */
export interface Question {
  /** 题目唯一 id(问卷内唯一) */
  id: string;
  /** 题型标识,对应注册表里的一个处理器,如 'single-choice' */
  type: string;
  /** 题干 */
  title: string;
  /** 填写提示:题干下方的说明文字,作答者可见(通用字段,所有题型共用) */
  hint?: string;
  /** 是否必答 */
  required?: boolean;
  /** 题型专属配置,核心层不解释其结构(约束 2) */
  props: Record<string, unknown>;
}

/**
 * 欢迎页富内容:作答者正式作答前先看到的一屏(标题 + 这段富内容 + 开始作答按钮)。
 * html 是富文本 HTML 串。**安全约束**:属不可信输入,渲染前必须经 XSS 消毒(白名单标签/属性),
 * 永不直接注入 DOM。后端当不透明字符串存/传,不解析内容。
 */
export interface WelcomeContent {
  /** 富文本 HTML 串。渲染前必须经 XSS 消毒;缺省/空串=无欢迎内容。 */
  html: string;
}

/** 一份问卷(某个已发布版本)。 */
export interface SurveySchema {
  id: string;
  type: SurveyType;
  title: string;
  /** schema 版本号。发布后改题递增,旧答卷按旧版本解释(约束 5) */
  version: number;
  questions: Question[];
  /** 逻辑规则,独立于题目(约束 3) */
  rules: LogicRule[];
  /** 欢迎页富内容(可选)。缺省=无欢迎内容,作答端仍显欢迎页但省略内容区。向后兼容:旧 schema 无此字段。 */
  welcome?: WelcomeContent;
}

/** 一条逻辑规则的条件:某题的答案与某值的比较。 */
export interface Condition {
  /** 被比较的题目 id */
  qid: string;
  /** 矩阵子行 id:引用某题的某一子行(如「Q3.易用性」);标量题省略 */
  subId?: string;
  op: ConditionOp;
  /** 比较值。语义由 op 决定 */
  value: unknown;
}

export type ConditionOp =
  | 'eq' // 等于
  | 'ne' // 不等于
  | 'includes' // 数组答案包含 value(多选)
  | 'gt' // 大于(数值)
  | 'lt' // 小于(数值)
  | 'answered' // 已作答(value 忽略)
  | 'empty'; // 未作答(value 忽略)

/** 条件组合子。 */
export type Combinator = 'AND' | 'OR';

/**
 * 规则动作。新增逻辑类型 = 新增一个 action.type,不改表结构(约束 3)。
 * MVP 只实现 show / hide;jump / pipe / end 等预留。
 */
export interface RuleAction {
  type: 'show' | 'hide' | 'jump' | 'end' | 'pipe';
  /** 动作目标题目 id(show/hide/jump 用) */
  target: string;
}

/** 一条逻辑规则:[条件组] --combinator--> [动作]。 */
export interface LogicRule {
  id: string;
  conditions: Condition[];
  combinator: Combinator;
  action: RuleAction;
}

/** 作答答案:题目 id → 答案值。值的结构由题型决定。 */
export type Answers = Record<string, unknown>;
