/**
 * 作答态(useReducer + engine)。runtime 不引全局 store(决策 11):作答是单页单流,
 * reducer 足矣。hidden 不进 state——它是 answers 的纯派生,由组件用 evaluate + useMemo 算。
 *
 * 断点续答(PRD §4.3 / 原型 prev.n3):answers 存 localStorage,key 带 surveyId,
 * 中途退出可续。这是 runtime 特有的壳能力,与 engine 无关。
 */
import { useReducer } from 'react';
import type { Answers } from '@xingjuan/engine';
import type { ValidationError } from '@xingjuan/engine';

/** 作答阶段:填写中 / 已提交。 */
export type Phase = 'fill' | 'done';

export interface FillState {
  answers: Answers;
  phase: Phase;
  /** 校验错误(仅在提交尝试后填充,避免一进页面满屏必答红) */
  errors: ValidationError[];
  /**
   * 是否已发起过提交尝试(对应原型 fTried)。一旦提交过就置真并保持,不随 setAnswer 复位——
   * 这样必答红/路径栏 miss 提示在用户逐题补填时持续、实时更新,而非编辑一下就全消失。
   * 仅 reset/done 复位。
   */
  triedSubmit: boolean;
  /** 提交请求进行中:禁用提交按钮、防重复提交 */
  submitting: boolean;
  /** 提交失败信息(网络/429/5xx);为 null 表示无提交层错误。校验类错误走 errors。 */
  submitError: string | null;
  /** 提交完成后的规范化行数(完成页摘要用,后端权威) */
  submittedRows: number;
}

export type FillAction =
  | { type: 'setAnswer'; qid: string; value: unknown }
  | { type: 'showErrors'; errors: ValidationError[] }
  | { type: 'submitStart' }
  | { type: 'submitFail'; message: string }
  | { type: 'done'; rows: number }
  | { type: 'reset' };

const storageKey = (surveyId: string) => `xingjuan:answers:${surveyId}`;

/** 从 localStorage 读断点续答的答案;失败(隐私模式/损坏)则空。 */
function loadAnswers(surveyId: string): Answers {
  try {
    const raw = localStorage.getItem(storageKey(surveyId));
    return raw ? (JSON.parse(raw) as Answers) : {};
  } catch {
    return {};
  }
}

function saveAnswers(surveyId: string, answers: Answers): void {
  try {
    localStorage.setItem(storageKey(surveyId), JSON.stringify(answers));
  } catch {
    // 隐私模式/超限:静默失败,不阻断作答
  }
}

function clearAnswers(surveyId: string): void {
  try {
    localStorage.removeItem(storageKey(surveyId));
  } catch {
    /* 忽略 */
  }
}

/** 用 surveyId 构造 reducer:setAnswer 时顺带落盘,提交/重置时清盘。导出供单测。 */
export function makeReducer(surveyId: string) {
  return function reducer(state: FillState, action: FillAction): FillState {
    switch (action.type) {
      case 'setAnswer': {
        const answers = { ...state.answers, [action.qid]: action.value };
        saveAnswers(surveyId, answers);
        // 改动答案即清掉上次的错误提示(校验 + 提交失败,下次提交重算)
        return { ...state, answers, errors: [], submitError: null };
      }
      case 'showErrors':
        // 提交尝试后拿到(本地或后端权威)校验错误:退出提交中态,亮逐题错误。
        // 本地校验失败会先于 submitStart 走到这里,故此处也置 triedSubmit(sticky)。
        return { ...state, errors: action.errors, submitting: false, submitError: null, triedSubmit: true };
      case 'submitStart':
        // 发起提交即视为「已尝试」并保持(sticky),后续 setAnswer 不复位 → 必答提示持续
        return { ...state, submitting: true, submitError: null, triedSubmit: true };
      case 'submitFail':
        // 提交层失败(网络/429/5xx):留在填写页,答案不丢(不清盘),可重试
        return { ...state, submitting: false, submitError: action.message };
      case 'done':
        clearAnswers(surveyId);
        return { ...state, phase: 'done', errors: [], submitting: false, submitError: null, triedSubmit: false, submittedRows: action.rows };
      case 'reset':
        clearAnswers(surveyId);
        return { answers: {}, phase: 'fill', errors: [], triedSubmit: false, submitting: false, submitError: null, submittedRows: 0 };
      default:
        return state;
    }
  };
}

/** 作答态 hook。初始 answers 从 localStorage 恢复(断点续答)。 */
export function useFill(surveyId: string) {
  return useReducer(makeReducer(surveyId), undefined, (): FillState => ({
    answers: loadAnswers(surveyId),
    phase: 'fill',
    errors: [],
    triedSubmit: false,
    submitting: false,
    submitError: null,
    submittedRows: 0,
  }));
}
