/**
 * 通用二次确认弹窗。用于结束回收 / 重新打开等有副作用、需用户明确点头的动作。
 * 纯受控组件:开关与两个动作(确认/取消)由父组件持有,弹窗只负责呈现与转发点击。
 * 遮罩点击 = 取消;沿用 SaveDialog 的 modal-mask/modal 风格(components.css §modal)。
 */
export interface ConfirmDialogProps {
  /** 是否可见 */
  open: boolean;
  /** 标题 */
  title: string;
  /** 正文说明 */
  body: string;
  /** 确认按钮文案(默认「确认」) */
  confirmLabel?: string;
  /** 处理中(禁用按钮、改文案) */
  busy?: boolean;
  /** 隐藏取消按钮:用于纯告知型拦截(只有一个「知道了」动作,无"取消"语义)。默认 false,不影响既有二次确认调用。 */
  hideCancel?: boolean;
  /** 确认动作 */
  onConfirm: () => void;
  /** 取消:关闭弹窗,不执行动作 */
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = '确认',
  busy = false,
  hideCancel = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="modal-mask" onClick={() => !busy && onCancel()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{title}</div>
        <div className="modal-body">{body}</div>
        <div className="modal-actions">
          {!hideCancel && (
            <button className="btn sm" disabled={busy} onClick={onCancel}>
              取消
            </button>
          )}
          <button className="btn primary sm" disabled={busy} onClick={onConfirm}>
            {busy ? '处理中…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
