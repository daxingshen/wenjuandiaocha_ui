/**
 * T2 完成判据:previewReducer 状态迁移 + runSubmit 校验拦截/放行,且零后端。
 * 断言无 localStorage / 无网络:reducer 与 runSubmit 均为纯函数,不 import client。
 */
import { describe, it, expect, vi } from 'vitest';
import { previewReducer, runSubmit, initialPreviewState } from './usePreview.js';
import type { SurveySchema } from '@xingjuan/engine';

const schema: SurveySchema = {
  id: 't', type: 'survey', title: 't', version: 1,
  questions: [
    { id: 'q1', type: 'single-choice', title: '必答单选', required: true, props: { options: [{ value: 'a', label: 'A' }] } },
  ],
  rules: [],
};

describe('previewReducer', () => {
  it('setAnswer 更新答案并清错误/回执', () => {
    const s = previewReducer({ answers: {}, errors: [{ qid: 'q1', message: 'x' }], submitted: 'blocked', curId: null }, { type: 'setAnswer', qid: 'q1', value: 'a' });
    expect(s.answers).toEqual({ q1: 'a' });
    expect(s.errors).toEqual([]);
    expect(s.submitted).toBe('none');
  });

  it('setCurrent 切换当前题(逐题预览翻页),不动答案/错误', () => {
    const s = previewReducer({ answers: { q1: 'a' }, errors: [{ qid: 'q2', message: 'x' }], submitted: 'blocked', curId: 'q1' }, { type: 'setCurrent', qid: 'q2' });
    expect(s.curId).toBe('q2');
    expect(s.answers).toEqual({ q1: 'a' }); // 翻页不改答案
    expect(s.errors).toEqual([{ qid: 'q2', message: 'x' }]); // 翻页不清错误
  });

  it('reset 清空(含 curId)', () => {
    const s = previewReducer({ answers: { q1: 'a' }, errors: [], submitted: 'ok', curId: 'q2' }, { type: 'reset' });
    expect(s).toEqual(initialPreviewState);
    expect(s.curId).toBeNull();
  });
});

describe('runSubmit · 校验拦截/放行', () => {
  it('未答必答题 → 拦截,submitted=blocked,返回首错 qid', () => {
    const dispatch = vi.fn();
    const r = runSubmit(schema, {}, dispatch);
    expect(r.ok).toBe(false);
    expect(r.firstErrorQid).toBe('q1');
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'showErrors' }));
  });

  it('必答已答 → 放行,submitted=ok', () => {
    const dispatch = vi.fn();
    const r = runSubmit(schema, { q1: 'a' }, dispatch);
    expect(r.ok).toBe(true);
    expect(dispatch).toHaveBeenCalledWith({ type: 'submitOk' });
  });
});
