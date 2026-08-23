/**
 * T9 判据:store setWelcome 更新 schema.welcome(仿 setTitle),undefined 清字段。
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from './useEditorStore.js';

const doc = { html: '<p>欢迎</p>' };

describe('useEditorStore.setWelcome', () => {
  beforeEach(() => {
    // 载入一份最小 schema,隔离每个用例。
    useEditorStore.getState().load({ id: 's1', type: 'survey', title: 't', version: 1, questions: [], rules: [] });
  });

  it('setWelcome 写入 schema.welcome', () => {
    useEditorStore.getState().setWelcome(doc);
    expect(useEditorStore.getState().schema?.welcome).toEqual(doc);
  });

  it('setWelcome(undefined) 清除 welcome 字段', () => {
    useEditorStore.getState().setWelcome(doc);
    useEditorStore.getState().setWelcome(undefined);
    expect(useEditorStore.getState().schema?.welcome).toBeUndefined();
  });

  it('setTitle 不影响已设的 welcome', () => {
    useEditorStore.getState().setWelcome(doc);
    useEditorStore.getState().setTitle('新标题');
    expect(useEditorStore.getState().schema?.title).toBe('新标题');
    expect(useEditorStore.getState().schema?.welcome).toEqual(doc);
  });
});
