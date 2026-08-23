/**
 * 发布页作答访问模式控件的呈现模式(纯函数,便于单测——studio 无 jsdom)。
 * 决策规则(gate①/③):
 *   - draft/live/closed:已落库问卷均可切换开关(发布后放开,answerAccess 切换在 UI 层加二次确认)。
 *   - new(内存草稿未落库):无库行可 PATCH,不显示控件。
 */
export type AccessControlMode = 'editable' | 'hidden';

export function answerAccessControlMode(status: string): AccessControlMode {
  if (status === 'draft' || status === 'live' || status === 'closed') return 'editable';
  return 'hidden'; // new 及未知状态:无库行可 PATCH,不显示控件
}
