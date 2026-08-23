/**
 * @xingjuan/ui/welcome —— 欢迎页富内容能力(并入 @xingjuan/ui)。
 * studio 编辑(WelcomeEditor:react-quill-new)+ studio 预览/runtime 只读(WelcomeView)+ 共享消毒。
 * 消毒规则是单一真相源(编辑所见=作答所得)。存 HTML 串。
 */
export { WelcomeView } from './WelcomeView.js';
export { WelcomeEditor } from './WelcomeEditor.js';
export { isWelcomeHtmlEmpty } from './renderHtml.js';
