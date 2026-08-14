import { describe, it, expect } from 'vitest';
import { answerAccessControlMode } from './answerAccessControl.js';

describe('answerAccessControlMode', () => {
  it('draft:可切换开关', () => {
    expect(answerAccessControlMode('draft')).toBe('editable');
  });
  it('live:只读回显(发布后锁定)', () => {
    expect(answerAccessControlMode('live')).toBe('readonly');
  });
  it('closed:只读回显', () => {
    expect(answerAccessControlMode('closed')).toBe('readonly');
  });
  it('new:不显示控件(无库行可 PATCH)', () => {
    expect(answerAccessControlMode('new')).toBe('hidden');
  });
  it('未知状态:保守不显示', () => {
    expect(answerAccessControlMode('')).toBe('hidden');
    expect(answerAccessControlMode('whatever')).toBe('hidden');
  });
});
