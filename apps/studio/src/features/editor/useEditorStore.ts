/**
 * 编辑器状态形状。Zustand 接线随「编辑器 MVP」切片引入(届时装 zustand 依赖),
 * 现在先把状态契约定下来,避免接线时才现设计。
 */
import type { SurveySchema } from '@xingjuan/engine';

export interface EditorState {
  /** 正在编辑的问卷(未加载为 null) */
  schema: SurveySchema | null;
  /** 当前选中的题目 id(决定右栏设置面板渲染谁) */
  selectedQid: string | null;
}

export const initialEditorState: EditorState = {
  schema: null,
  selectedQid: null,
};
