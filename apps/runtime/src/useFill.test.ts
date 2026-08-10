/**
 * fill 作答态机单测(纯 reducer,零网络)。
 * 锁死本轮修复的提交态语义:submitStart→submitting;submitFail 留在填写页且不清盘(答案可重试);
 * showErrors 退出提交中;done/reset 才清盘。回归防护:setAnswer 清掉上次提交错误。
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { makeReducer, type FillState } from './useFill.js';

const reducer = makeReducer('sid-test');
const KEY = 'xingjuan:answers:sid-test';

// 工作区默认 node 环境(无 jsdom);用最小内存 localStorage 桩,以便断言断点续答的落盘/清盘。
const mem = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
  clear: () => mem.clear(),
});

const base = (over: Partial<FillState> = {}): FillState => ({
  answers: {},
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
    expect(s).toEqual(base());
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});
