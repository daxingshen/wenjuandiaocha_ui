/**
 * 欢迎页富内容编辑器(studio 专属)。开箱即用的开源整包 react-quill-new(Quill 2),自定义工具栏。
 * 内容契约:value.html(Quill HTML) ↔ onChange({ html })。存 HTML 串。
 * 工具集:字体大小 / 粗斜下删 / 字体颜色 · 背景色 / 对齐 / 有序·无序列表 / 段落缩进 / 引用 / 清除。
 *   —— 每一项产出的标签/class/inline style 都落在 sanitizeWelcomeHtml 白名单内(否则渲染时被剔)。
 * 悬浮提示:Quill 工具按钮原生无 title,挂载后按选择器补中文 title(见 TOOL_TITLES)。
 * 安全边界在 sanitizeWelcomeHtml(作答端只读渲染共用):无论编辑器产出什么,渲染前都消毒。
 * Quill 样式随本组件引入(仅 studio);runtime 不引本组件,故 Quill CSS 不进作答端产物。
 */
import { useEffect, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import type { WelcomeContent } from '@xingjuan/engine';
import 'react-quill-new/dist/quill.snow.css';

// 工具栏配置(数组式)。每组产出均在消毒白名单内:size→ql-size-*;
// color/background→inline style;align→ql-align-*;list→ul/ol;indent→ql-indent-*;blockquote→blockquote。
const MODULES = {
  toolbar: [
    [{ size: ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    ['blockquote'],
    ['clean'],
  ],
};

// 只放行上述格式(收窄面,防止粘贴带入白名单外格式)。
const FORMATS = [
  'size', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'align', 'list', 'indent', 'blockquote',
];

// 悬浮提示:选择器 → 中文 title。Quill 工具按钮原生无 title,故手动补。
const TOOL_TITLES: [string, string][] = [
  ['.ql-size', '字体大小'],
  ['.ql-bold', '加粗'],
  ['.ql-italic', '斜体'],
  ['.ql-underline', '下划线'],
  ['.ql-strike', '删除线'],
  ['.ql-color', '字体颜色'],
  ['.ql-background', '背景色'],
  ['.ql-align', '对齐方式'],
  ['.ql-list[value="ordered"]', '有序列表'],
  ['.ql-list[value="bullet"]', '无序列表'],
  ['.ql-indent[value="-1"]', '减少缩进'],
  ['.ql-indent[value="+1"]', '增加缩进'],
  ['.ql-blockquote', '引用'],
  ['.ql-clean', '清除格式'],
];

export function WelcomeEditor({
  value,
  onChange,
}: {
  value?: WelcomeContent;
  onChange: (next: WelcomeContent) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  // 挂载后给工具栏按钮补 title(Quill 同步建好 toolbar DOM,单次即可)。
  useEffect(() => {
    const toolbar = rootRef.current?.querySelector('.ql-toolbar');
    if (!toolbar) return;
    for (const [selector, title] of TOOL_TITLES) {
      toolbar.querySelectorAll(selector).forEach((el) => el.setAttribute('title', title));
    }
  }, []);

  return (
    <div className="wel-editor" ref={rootRef}>
      <ReactQuill
        theme="snow"
        modules={MODULES}
        formats={FORMATS}
        value={value?.html ?? ''}
        onChange={(next) => onChange({ html: next })}
        placeholder="写一段欢迎语,作答者开始前会看到"
      />
    </div>
  );
}
