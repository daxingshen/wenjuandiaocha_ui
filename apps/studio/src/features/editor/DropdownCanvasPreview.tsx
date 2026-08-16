/**
 * 中栏画布内下拉框的「展开」编辑态(studio 专属):把选项以展开下拉菜单的形式平铺,
 * 比原生 <select> 只露选中项直观。支持画布内联:改选项文字、✕ 删、＋ 增,与右栏「选项」tab
 * 双向同步(改同一份 question.props)。默认选中项高亮标记;设默认仍在右栏。
 * 不走作答端 Answer 组件(那是真·下拉);作答端契约保持零负担。
 */
import type { Question } from '@xingjuan/engine';
import type { DropdownOption, DropdownProps } from '@xingjuan/question-types';
import { useEditorStore } from './useEditorStore.js';

export function DropdownCanvasPreview({ question }: { question: Question }) {
  const updateQuestion = useEditorStore((s) => s.updateQuestion);
  const p = question.props as Partial<DropdownProps>;
  const options = (p.options ?? []) as DropdownOption[];
  const defaultValue = p.defaultValue;

  const patch = (next: Partial<DropdownProps>) =>
    updateQuestion(question.id, { props: { ...question.props, ...next } });
  const setOptions = (opts: DropdownOption[]) => patch({ options: opts });

  const setLabel = (i: number, label: string) =>
    setOptions(options.map((o, j) => (j === i ? { ...o, label } : o)));

  const del = (i: number) => {
    if (options.length <= 1) return; // 保底至少一项
    const removed = options[i];
    const nextOpts = options.filter((_, j) => j !== i);
    // 删掉的正是默认项 → 一并清空默认。
    if (removed && defaultValue === removed.value) patch({ options: nextOpts, defaultValue: undefined });
    else setOptions(nextOpts);
  };

  const add = () =>
    setOptions([...options, { value: `opt${options.length + 1}`, label: `选项${options.length + 1}` }]);

  return (
    <div className="dd-canvas">
      {/* 收起态外观:一个「已展开」的下拉控件头 */}
      <div className="dd-canvas-head">
        <span className="dd-canvas-head-txt">请选择</span>
        <span className="dd-canvas-caret">▾</span>
      </div>
      {/* 展开的菜单:平铺所有选项 */}
      <div className="dd-canvas-menu">
        {options.map((opt, i) => {
          const isDefault = defaultValue !== undefined && defaultValue !== '' && opt.value === defaultValue;
          return (
            <div key={i} className={`dd-canvas-item${isDefault ? ' sel' : ''}`}>
              <input
                className="dd-canvas-in"
                placeholder="选项文字"
                value={opt.label}
                onChange={(e) => setLabel(i, e.target.value)}
              />
              {isDefault && <span className="dd-canvas-flag">默认</span>}
              <button type="button" className="obtn del" title="删除选项" onClick={() => del(i)}>
                ✕
              </button>
            </div>
          );
        })}
        <div className="dd-canvas-add" onClick={add}>＋ 添加选项</div>
      </div>
    </div>
  );
}
