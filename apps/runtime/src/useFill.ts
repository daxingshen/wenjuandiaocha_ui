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

// 断点续答落盘 key 带版本(版本锚定):作答者答的是哪一版,续答就存/取哪一版。
// 所有者中途重发新版后,刷新加载的是新版对应的(空)答案集,旧版答案不跨版套到新 schema 上
// (旧版新增必答题空着、改过的选项值失效、删掉的题答案残留 —— 这些跨版污染由版本隔离消除)。
const storageKey = (surveyId: string, version: number) => `xingjuan:answers:${surveyId}:v${version}`;

/** 从 localStorage 读断点续答的答案;失败(隐私模式/损坏)则空。 */
function loadAnswers(surveyId: string, version: number): Answers {
  try {
    const raw = localStorage.getItem(storageKey(surveyId, version));
    return raw ? (JSON.parse(raw) as Answers) : {};
  } catch {
    return {};
  }
}

function saveAnswers(surveyId: string, version: number, answers: Answers): void {
  try {
    localStorage.setItem(storageKey(surveyId, version), JSON.stringify(answers));
  } catch {
    // 隐私模式/超限:静默失败,不阻断作答
  }
}

function clearAnswers(surveyId: string, version: number): void {
  try {
    localStorage.removeItem(storageKey(surveyId, version));
  } catch {
    /* 忽略 */
  }
}

// sweepStaleVersions 清掉同一问卷「其它版本」的续答缓存。
// 浏览器同一时刻只对应一个对外版本(fetchSurvey 取当前版),故 keyPrefix 下非当前版的 key 必是
// 上次作答遗留(所有者重发过新版)—— 换版后旧版答案本就不该续答(版本锚定),留着只是孤儿泄漏。
// 仅按精确前缀 `xingjuan:answers:${id}:v` 匹配:id 是定长 8 位 base32,前缀无歧义,不会误删他卷。
export function sweepStaleVersions(surveyId: string, keepVersion: number): void {
  try {
    const prefix = `xingjuan:answers:${surveyId}:v`;
    const keep = storageKey(surveyId, keepVersion);
    // 先收集再删:removeItem 会改变 localStorage.length/索引,不能边遍历边删。
    const stale: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k !== keep && k.startsWith(prefix)) stale.push(k);
    }
    stale.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* 隐私模式/异常:静默,不阻断作答 */
  }
}

/** 用 (surveyId, version) 构造 reducer:setAnswer 时顺带落盘,提交/重置时清盘。导出供单测。 */
export function makeReducer(surveyId: string, version: number) {
  return function reducer(state: FillState, action: FillAction): FillState {
    switch (action.type) {
      case 'setAnswer': {
        const answers = { ...state.answers, [action.qid]: action.value };
        saveAnswers(surveyId, version, answers);
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
        clearAnswers(surveyId, version);
        return { ...state, phase: 'done', errors: [], submitting: false, submitError: null, triedSubmit: false, submittedRows: action.rows };
      case 'reset':
        clearAnswers(surveyId, version);
        return { answers: {}, phase: 'fill', errors: [], triedSubmit: false, submitting: false, submitError: null, submittedRows: 0 };
      default:
        return state;
    }
  };
}

/** 作答态 hook。初始 answers 从 localStorage 恢复(断点续答,按版本隔离);顺带清同卷旧版孤儿缓存。 */
export function useFill(surveyId: string, version: number) {
  return useReducer(makeReducer(surveyId, version), undefined, (): FillState => {
    // 载入即清理:同卷其它版本的续答缓存是换版遗留,按版本锚定本就不续,清掉防孤儿泄漏。
    sweepStaleVersions(surveyId, version);
    return {
      answers: loadAnswers(surveyId, version),
      phase: 'fill',
      errors: [],
      triedSubmit: false,
      submitting: false,
      submitError: null,
      submittedRows: 0,
    };
  });
}
