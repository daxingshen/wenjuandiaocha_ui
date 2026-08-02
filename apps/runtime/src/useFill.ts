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
  /** 提交完成后的规范化行数(完成页摘要用) */
  submittedRows: number;
}

export type FillAction =
  | { type: 'setAnswer'; qid: string; value: unknown }
  | { type: 'showErrors'; errors: ValidationError[] }
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

/** 用 surveyId 构造 reducer:setAnswer 时顺带落盘,提交/重置时清盘。 */
function makeReducer(surveyId: string) {
  return function reducer(state: FillState, action: FillAction): FillState {
    switch (action.type) {
      case 'setAnswer': {
        const answers = { ...state.answers, [action.qid]: action.value };
        saveAnswers(surveyId, answers);
        // 改动答案即清掉上次的错误提示(下次提交重算)
        return { ...state, answers, errors: [] };
      }
      case 'showErrors':
        return { ...state, errors: action.errors };
      case 'done':
        clearAnswers(surveyId);
        return { ...state, phase: 'done', errors: [], submittedRows: action.rows };
      case 'reset':
        clearAnswers(surveyId);
        return { answers: {}, phase: 'fill', errors: [], submittedRows: 0 };
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
    submittedRows: 0,
  }));
}
