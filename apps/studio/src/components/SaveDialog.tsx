/**
 * 保存二次确认弹窗。点顶栏「保存」先弹此框,让用户明确选择:
 * 保存(存后留在编辑器)/ 保存并返回(存后回看板)/ 取消(不存、关框)。
 * 纯受控组件:开关与三个动作由父组件(survey 路由)持有,弹窗只负责呈现与转发点击。
 * 遮罩点击 = 取消;Esc 关闭由父组件按需接管(此处不抢焦点管理,保持无状态)。
 */
export interface SaveDialogProps {
  /** 是否可见 */
  open: boolean;
  /** 保存中(禁用按钮、改文案) */
  saving: boolean;
  /** 仅保存 */
  onSave: () => void;
  /** 保存并返回看板 */
  onSaveAndBack: () => void;
  /** 取消:关闭弹窗,不保存 */
  onCancel: () => void;
}

export function SaveDialog({ open, saving, onSave, onSaveAndBack, onCancel }: SaveDialogProps) {
  if (!open) return null;
  return (
    <div className="modal-mask" onClick={() => !saving && onCancel()}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="保存问卷"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-title">保存问卷</div>
        <div className="modal-body">保存当前改动后,你想继续编辑还是返回看板?</div>
        <div className="modal-actions">
          <button className="btn sm" disabled={saving} onClick={onCancel}>
            取消
          </button>
          <button className="btn sm" disabled={saving} onClick={onSaveAndBack}>
            {saving ? '保存中…' : '保存并返回'}
          </button>
          <button className="btn primary sm" disabled={saving} onClick={onSave}>
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
