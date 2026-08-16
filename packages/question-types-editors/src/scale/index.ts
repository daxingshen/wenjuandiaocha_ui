/** 量表题编辑器:反向登记编辑描述符到 question-types 的 editorRegistry(仅 studio 调用)。 */
import { registerEditor } from '@xingjuan/question-types';
import { ScaleEditor } from './Editor.js';

export function registerScaleEditor(): void {
  registerEditor('scale', {
    Editor: ScaleEditor,
    // 无画布内联编辑(选中走只读 Answer);无中间 tab(配置全在「题型」tab)——修掉原空「选项」tab。
    sections: [],
  });
}
