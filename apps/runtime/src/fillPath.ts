/**
 * 作答路径栏(.fill-rail 时间线)的纯派生逻辑。从 Fill.tsx 抽出以便单测:
 * 输入 schema + answers + 已隐藏题集 + 是否已提交尝试,输出每题的节点态 + 跳过原因。
 * 无 DOM、无 React,纯函数(对应原型 §4.5 的 fSync 路径节点部分)。
 */
import type { Answers, SurveySchema } from '@xingjuan/engine';

/** 路径节点态。'' 中性(未答的非当前可见题)/ done 已答 / cur 当前待答 / miss 必答未完成(仅提交尝试后)/ skip 被逻辑跳过。 */
export type NodeStatus = '' | 'done' | 'cur' | 'miss' | 'skip';

export interface PathNode {
  qid: string;
  /** 题目在问卷中的序号(1 起,含隐藏题,与作答列 Q 号一致)。 */
  no: number;
  title: string;
  status: NodeStatus;
  /** 被跳过时,触发隐藏的源题序号(用于「因 Qx 跳过」文案);无则 undefined。 */
  srcNo?: number;
}

/** 是否已作答(与进度/校验口径一致:undefined/null/'' 视为未答)。 */
export function isAnswered(value: unknown): boolean {
  return value !== undefined && value !== null && value !== '';
}

/**
 * 构造路径栏节点。遍历「全部题」(含隐藏):隐藏题标 skip 并附源题序号;
 * 可见题按 已答=done / (提交尝试后)必答未完成=miss / 首个未答=cur / 其余=中性 分档。
 */
export function buildPath(
  schema: SurveySchema,
  answers: Answers,
  hidden: Set<string>,
  tried: boolean,
): PathNode[] {
  const indexOf = new Map(schema.questions.map((q, i) => [q.id, i + 1]));
  const visible = schema.questions.filter((q) => !hidden.has(q.id));
  const firstUnanswered = visible.find((q) => !isAnswered(answers[q.id]));

  return schema.questions.map((q, i) => {
    let status: NodeStatus;
    let srcNo: number | undefined;
    if (hidden.has(q.id)) {
      status = 'skip';
      // 找命中的 hide 规则,取其第一个条件的源题序号(原型「因 Qx 的选择跳过」)
      const rule = schema.rules.find((r) => r.action.type === 'hide' && r.action.target === q.id);
      const srcQid = rule?.conditions[0]?.qid;
      srcNo = srcQid ? indexOf.get(srcQid) : undefined;
    } else if (isAnswered(answers[q.id])) {
      status = 'done';
    } else if (tried && q.required) {
      status = 'miss';
    } else if (q === firstUnanswered) {
      status = 'cur';
    } else {
      status = '';
    }
    return { qid: q.id, no: i + 1, title: q.title, status, srcNo };
  });
}
