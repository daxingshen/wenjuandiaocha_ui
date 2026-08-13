import { describe, it, expect } from 'vitest';
import { canEditSurvey } from './editGate.js';

describe('canEditSurvey', () => {
  it('草稿可编辑', () => {
    expect(canEditSurvey('draft')).toBe(true);
  });
  it('进行中(live)禁止编辑', () => {
    expect(canEditSurvey('live')).toBe(false);
  });
  it('已截止(closed)禁止编辑', () => {
    expect(canEditSurvey('closed')).toBe(false);
  });
  it('未知状态默认禁止编辑(保守)', () => {
    expect(canEditSurvey('')).toBe(false);
    expect(canEditSurvey('whatever')).toBe(false);
  });
});
