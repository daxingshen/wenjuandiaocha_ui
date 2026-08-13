/**
 * 编辑入口守卫规则(纯函数,与 UI 解耦便于单测)。
 * 规则:仅草稿(draft)可编辑;已发布——进行中(live)/已截止(closed)——内容已冻结,禁止编辑。
 * 前端据此弹窗拦截;后端 Update 接口有对应的 40901 守卫作为真正防线。
 */
export function canEditSurvey(status: string): boolean {
  return status === 'draft';
}
