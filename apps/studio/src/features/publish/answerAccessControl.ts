/**
 * 发布页作答访问模式控件的呈现模式(纯函数,便于单测——studio 无 jsdom)。
 * 决策规则(gate①/③):
 *   - draft:可切换开关(唯一可改窗口,发布前定好)。
 *   - live/closed:只读纯文字回显(发布后锁定,改需回编辑;避免误点)。
 *   - new(内存草稿未落库):无库行可 PATCH,不显示控件。
 */
export type AccessControlMode = 'editable' | 'readonly' | 'hidden';

export function answerAccessControlMode(status: string): AccessControlMode {
  if (status === 'draft') return 'editable';
  if (status === 'live' || status === 'closed') return 'readonly';
  return 'hidden'; // new 及未知状态:保守不显示可改控件
}
