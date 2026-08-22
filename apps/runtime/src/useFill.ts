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
  /**
   * 逐题作答(displayMode='paged')的当前题 id;刷新续答用(存独立 key)。null=无持久指针,
   * 由组件回落到「首个未答可见题」。单页作答(single,默认)永不写它,行为不受影响。
   */
  curId: string | null;
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
  | { type: 'setCurrent'; qid: string }
  | { type: 'showErrors'; errors: ValidationError[] }
  | { type: 'submitStart' }
  | { type: 'submitFail'; message: string }
  | { type: 'done'; rows: number }
  | { type: 'reset' };

// 断点续答落盘 key 带版本(版本锚定):作答者答的是哪一版,续答就存/取哪一版。
// 所有者中途重发新版后,刷新加载的是新版对应的(空)答案集,旧版答案不跨版套到新 schema 上
// (旧版新增必答题空着、改过的选项值失效、删掉的题答案残留 —— 这些跨版污染由版本隔离消除)。
const storageKey = (surveyId: string, version: number) => `xingjuan:answers:${surveyId}:v${version}`;
// 逐题指针存独立 key(与 answers 解耦):旧数据只有 answers key、无此 key,load 读到 null 即回落,
// 不抛错、不改变既有单页续答行为(向后兼容)。
const cursorKey = (surveyId: string, version: number) => `xingjuan:cursor:${surveyId}:v${version}`;

/** 从 localStorage 读断点续答的答案;失败(隐私模式/损坏)则空。 */
function loadAnswers(surveyId: string, version: number): Answers {
  try {
    const raw = localStorage.getItem(storageKey(surveyId, version));
    return raw ? (JSON.parse(raw) as Answers) : {};
  } catch {
    return {};
  }
}

/** 从 localStorage 读逐题当前指针;无(旧数据/单页作答)或失败则 null,由组件回落首个未答题。 */
function loadCursor(surveyId: string, version: number): string | null {
  try {
    const raw = localStorage.getItem(cursorKey(surveyId, version));
    return raw ? (JSON.parse(raw) as string) : null;
  } catch {
    return null;
  }
}

function saveCursor(surveyId: string, version: number, qid: string): void {
  try {
    localStorage.setItem(cursorKey(surveyId, version), JSON.stringify(qid));
  } catch {
    // 隐私模式/超限:静默失败,不阻断作答
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
    localStorage.removeItem(cursorKey(surveyId, version)); // 指针随答案一并清(提交完成/重置)
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
    // answers 与 cursor 两族 key 都要清:非当前版的都是换版遗留孤儿(含逐题指针)。
    const answersPrefix = `xingjuan:answers:${surveyId}:v`;
    const cursorPrefix = `xingjuan:cursor:${surveyId}:v`;
    const keepAnswers = storageKey(surveyId, keepVersion);
    const keepCursor = cursorKey(surveyId, keepVersion);
    // 先收集再删:removeItem 会改变 localStorage.length/索引,不能边遍历边删。
    const stale: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k !== keepAnswers && k.startsWith(answersPrefix)) stale.push(k);
      else if (k !== keepCursor && k.startsWith(cursorPrefix)) stale.push(k);
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
      case 'setCurrent':
        // 逐题作答翻页:落盘当前题指针,刷新续答回到同一题。单页作答不派发此 action。
        saveCursor(surveyId, version, action.qid);
        return { ...state, curId: action.qid };
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
        return { ...state, phase: 'done', curId: null, errors: [], submitting: false, submitError: null, triedSubmit: false, submittedRows: action.rows };
      case 'reset':
        clearAnswers(surveyId, version);
        return { answers: {}, curId: null, phase: 'fill', errors: [], triedSubmit: false, submitting: false, submitError: null, submittedRows: 0 };
      default:
        return state;
    }
  };
}

/**
 * 惰性初始化:从 localStorage 恢复 answers + 逐题指针 curId(按版本隔离),顺带清同卷旧版孤儿缓存。
 * 抽成导出纯函数(不依赖 React)便于单测续答/回落语义,与 makeReducer 同样风格。
 */
export function makeInitialState(surveyId: string, version: number): FillState {
  // 载入即清理:同卷其它版本的续答缓存是换版遗留,按版本锚定本就不续,清掉防孤儿泄漏。
  sweepStaleVersions(surveyId, version);
  return {
    answers: loadAnswers(surveyId, version),
    // 逐题指针从独立 key 恢复(旧数据无此 key → null,组件回落首个未答题)。
    curId: loadCursor(surveyId, version),
    phase: 'fill',
    errors: [],
    triedSubmit: false,
    submitting: false,
    submitError: null,
    submittedRows: 0,
  };
}

/** 作答态 hook。初始 answers/指针从 localStorage 恢复(断点续答,按版本隔离);顺带清同卷旧版孤儿缓存。 */
export function useFill(surveyId: string, version: number) {
  return useReducer(makeReducer(surveyId, version), undefined, () => makeInitialState(surveyId, version));
}
