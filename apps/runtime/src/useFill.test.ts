/**
 * fill 作答态机单测(纯 reducer,零网络)。
 * 锁死本轮修复的提交态语义:submitStart→submitting;submitFail 留在填写页且不清盘(答案可重试);
 * showErrors 退出提交中;done/reset 才清盘。回归防护:setAnswer 清掉上次提交错误。
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { makeReducer, makeInitialState, sweepStaleVersions, type FillState } from './useFill.js';

const reducer = makeReducer('sid-test', 1);
const KEY = 'xingjuan:answers:sid-test:v1';

// 工作区默认 node 环境(无 jsdom);用最小内存 localStorage 桩,以便断言断点续答的落盘/清盘。
// 含 length / key(i):sweepStaleVersions 靠它们枚举 key(桩需贴近真实 Storage 接口)。
const mem = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
  clear: () => mem.clear(),
  get length() {
    return mem.size;
  },
  key: (i: number) => [...mem.keys()][i] ?? null,
});

const base = (over: Partial<FillState> = {}): FillState => ({
  answers: {},
  curId: null,
  phase: 'fill',
  errors: [],
  triedSubmit: false,
  submitting: false,
  submitError: null,
  submittedRows: 0,
  ...over,
});

beforeEach(() => {
  localStorage.clear();
});

describe('提交态机', () => {
  it('submitStart 置 submitting、清提交错误', () => {
    const s = reducer(base({ submitError: '网络异常' }), { type: 'submitStart' });
    expect(s.submitting).toBe(true);
    expect(s.submitError).toBeNull();
  });

  it('submitFail 退出 submitting、留在填写页、记录错误、且不清盘(答案可重试)', () => {
    localStorage.setItem(KEY, JSON.stringify({ q1: 'a' }));
    const s = reducer(base({ submitting: true, answers: { q1: 'a' } }), { type: 'submitFail', message: '提交过于频繁' });
    expect(s.submitting).toBe(false);
    expect(s.submitError).toBe('提交过于频繁');
    expect(s.phase).toBe('fill');
    expect(s.answers).toEqual({ q1: 'a' });
    expect(localStorage.getItem(KEY)).toBe(JSON.stringify({ q1: 'a' })); // 关键:失败不清盘
  });

  it('showErrors 退出 submitting 并亮逐题错误', () => {
    const s = reducer(base({ submitting: true }), { type: 'showErrors', errors: [{ qid: 'q1', message: '必填' }] });
    expect(s.submitting).toBe(false);
    expect(s.errors).toEqual([{ qid: 'q1', message: '必填' }]);
  });

  it('done 进完成页、记录后端 rows、清盘', () => {
    localStorage.setItem(KEY, JSON.stringify({ q1: 'a' }));
    const s = reducer(base({ submitting: true, answers: { q1: 'a' } }), { type: 'done', rows: 3 });
    expect(s.phase).toBe('done');
    expect(s.submittedRows).toBe(3);
    expect(s.submitting).toBe(false);
    expect(localStorage.getItem(KEY)).toBeNull(); // 成功才清盘
  });

  it('setAnswer 清掉上次的提交错误与校验错误', () => {
    const s = reducer(
      base({ submitError: '提交失败', errors: [{ qid: 'q1', message: 'x' }] }),
      { type: 'setAnswer', qid: 'q1', value: 'b' },
    );
    expect(s.submitError).toBeNull();
    expect(s.errors).toEqual([]);
    expect(s.answers).toEqual({ q1: 'b' });
  });

  it('triedSubmit 是 sticky:showErrors/submitStart 置真,setAnswer 不复位', () => {
    // 本地校验失败(先于 submitStart)即置 tried
    const afterShow = reducer(base(), { type: 'showErrors', errors: [{ qid: 'q1', message: '必填' }] });
    expect(afterShow.triedSubmit).toBe(true);
    // 编辑答案清错误,但 tried 保持 → 必答提示在补填时持续
    const afterEdit = reducer(afterShow, { type: 'setAnswer', qid: 'q1', value: 'b' });
    expect(afterEdit.errors).toEqual([]);
    expect(afterEdit.triedSubmit).toBe(true);
    // submitStart 也置真
    expect(reducer(base(), { type: 'submitStart' }).triedSubmit).toBe(true);
  });

  it('done / reset 复位 triedSubmit', () => {
    expect(reducer(base({ triedSubmit: true }), { type: 'done', rows: 1 }).triedSubmit).toBe(false);
    expect(reducer(base({ triedSubmit: true }), { type: 'reset' }).triedSubmit).toBe(false);
  });

  it('reset 回到初始并清盘', () => {
    localStorage.setItem(KEY, JSON.stringify({ q1: 'a' }));
    const s = reducer(base({ phase: 'done', submittedRows: 2 }), { type: 'reset' });
    // v3:reset 回到欢迎页(第 0 站),而非直接 fill——重置后重新走一遍欢迎屏。
    expect(s).toEqual(base({ phase: 'welcome' }));
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});

describe('版本隔离(版本锚定)', () => {
  it('不同版本落盘 key 不同 —— 换版后旧答案不跨版套用', () => {
    const v1 = makeReducer('sid-x', 1);
    const v2 = makeReducer('sid-x', 2);
    v1(base(), { type: 'setAnswer', qid: 'q1', value: 'a' });
    expect(localStorage.getItem('xingjuan:answers:sid-x:v1')).toBe(JSON.stringify({ q1: 'a' }));
    // v2 的落盘写到独立 key,不污染 v1
    v2(base(), { type: 'setAnswer', qid: 'q1', value: 'b' });
    expect(localStorage.getItem('xingjuan:answers:sid-x:v2')).toBe(JSON.stringify({ q1: 'b' }));
    expect(localStorage.getItem('xingjuan:answers:sid-x:v1')).toBe(JSON.stringify({ q1: 'a' }));
  });
});

describe('逐题指针持久化(setCurrent / 独立 cursor key)', () => {
  const CURSOR_KEY = 'xingjuan:cursor:sid-test:v1';

  it('setCurrent 落盘当前题 id 到独立 cursor key,并置 state.curId', () => {
    const s = reducer(base(), { type: 'setCurrent', qid: 'q3' });
    expect(s.curId).toBe('q3');
    expect(localStorage.getItem(CURSOR_KEY)).toBe(JSON.stringify('q3'));
    // 不误写 answers key
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('done 清盘同时清掉 cursor key,并复位 curId', () => {
    localStorage.setItem(KEY, JSON.stringify({ q1: 'a' }));
    localStorage.setItem(CURSOR_KEY, JSON.stringify('q2'));
    const s = reducer(base({ curId: 'q2', answers: { q1: 'a' } }), { type: 'done', rows: 1 });
    expect(s.curId).toBeNull();
    expect(localStorage.getItem(CURSOR_KEY)).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('reset 清掉 cursor key 并复位 curId', () => {
    localStorage.setItem(CURSOR_KEY, JSON.stringify('q2'));
    const s = reducer(base({ curId: 'q2' }), { type: 'reset' });
    expect(s.curId).toBeNull();
    expect(localStorage.getItem(CURSOR_KEY)).toBeNull();
  });

  it('setAnswer 不动 cursor(改答案不改当前题指针)', () => {
    localStorage.setItem(CURSOR_KEY, JSON.stringify('q2'));
    const s = reducer(base({ curId: 'q2' }), { type: 'setAnswer', qid: 'q2', value: 'x' });
    expect(s.curId).toBe('q2');
    expect(localStorage.getItem(CURSOR_KEY)).toBe(JSON.stringify('q2'));
  });

  it('useFill 惰性初始化:有 cursor key → 恢复 curId;仅有 answers 的旧数据 → curId 回落 null(不抛)', () => {
    // 旧数据:只有 answers key、无 cursor key。恢复不该抛,curId 应为 null(组件据此回落首个未答题)。
    localStorage.setItem(KEY, JSON.stringify({ q1: 'a' }));
    const oldState = makeInitialState('sid-test', 1);
    expect(oldState.answers).toEqual({ q1: 'a' });
    expect(oldState.curId).toBeNull();

    // 新数据:有 cursor key → 恢复到该题。
    localStorage.setItem(CURSOR_KEY, JSON.stringify('q2'));
    const newState = makeInitialState('sid-test', 1);
    expect(newState.curId).toBe('q2');
  });
});

describe('孤儿缓存清理(sweepStaleVersions)', () => {
  it('载入新版时清掉同卷旧版 key,保留当前版与他卷', () => {
    localStorage.setItem('xingjuan:answers:sid-x:v1', JSON.stringify({ q1: 'old' }));
    localStorage.setItem('xingjuan:answers:sid-x:v2', JSON.stringify({ q1: 'cur' }));
    localStorage.setItem('xingjuan:answers:sid-y:v1', JSON.stringify({ q1: 'other' })); // 他卷,不该动
    // 载入 sid-x 的 v2:清掉同卷旧版 v1,保留 v2 与他卷
    sweepStaleVersions('sid-x', 2);
    expect(localStorage.getItem('xingjuan:answers:sid-x:v1')).toBeNull(); // 旧版孤儿清掉
    expect(localStorage.getItem('xingjuan:answers:sid-x:v2')).toBe(JSON.stringify({ q1: 'cur' })); // 当前版保留
    expect(localStorage.getItem('xingjuan:answers:sid-y:v1')).toBe(JSON.stringify({ q1: 'other' })); // 他卷保留
  });
});

describe('欢迎页相位(welcome phase + startedKey)', () => {
  const STARTED_KEY = 'xingjuan:started:sid-test:v1';

  it('首次进入(无 started 标记)初始相位为 welcome', () => {
    const s = makeInitialState('sid-test', 1);
    expect(s.phase).toBe('welcome');
  });

  it('start action 落 started 标记并进 fill', () => {
    const s = reducer(base({ phase: 'welcome' }), { type: 'start' });
    expect(s.phase).toBe('fill');
    expect(localStorage.getItem(STARTED_KEY)).toBe('1');
  });

  it('已点过开始(有 started 标记)续答直接回 fill,不重看欢迎', () => {
    localStorage.setItem(STARTED_KEY, '1');
    const s = makeInitialState('sid-test', 1);
    expect(s.phase).toBe('fill');
  });

  it('done 清 started 标记', () => {
    localStorage.setItem(STARTED_KEY, '1');
    reducer(base({ phase: 'fill' }), { type: 'done', rows: 3 });
    expect(localStorage.getItem(STARTED_KEY)).toBeNull();
  });

  it('reset 回到 welcome 并清 started 标记', () => {
    localStorage.setItem(STARTED_KEY, '1');
    const s = reducer(base({ phase: 'fill' }), { type: 'reset' });
    expect(s.phase).toBe('welcome');
    expect(localStorage.getItem(STARTED_KEY)).toBeNull();
  });

  it('started 标记按版本隔离:v1 已开始不影响 v2', () => {
    localStorage.setItem(STARTED_KEY, '1');
    const s2 = makeInitialState('sid-test', 2); // 不同版本
    expect(s2.phase).toBe('welcome');
  });
});
