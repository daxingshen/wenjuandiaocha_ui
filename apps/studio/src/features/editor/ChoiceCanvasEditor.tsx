/**
 * 中栏画布内选中「选择题」的编辑态选项列表(studio 专属,决策2-A):
 * 选项可内联改文字、点选高亮(与右栏选项 tab 双向同步)、✕ 删除、拖拽把手原生 DnD 重排。
 * 单选(radio 记号)与多选(checkbox 记号)共用本组件,靠 mode 区分记号形态——选项结构同源。
 * 不走作答端 Answer 组件(那是只读预览);作答端契约 AnswerProps 因此保持零负担。
 * 用原型 .opt-list/.opt-row/.opt-ed/.oin/.drag/.obtn 类(样式见 components.css)。
 */
import { useState } from 'react';
import type { Question } from '@xingjuan/engine';
import type { SingleChoiceOption, SingleChoiceProps } from '@xingjuan/question-types';
import { useEditorStore } from './useEditorStore.js';

export function ChoiceCanvasEditor({ question, mode }: { question: Question; mode: 'single' | 'multi' }) {
  const updateQuestion = useEditorStore((s) => s.updateQuestion);
  const selectedOptIndex = useEditorStore((s) => s.selectedOptIndex);
  const selectOption = useEditorStore((s) => s.selectOption);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const p = question.props as Partial<SingleChoiceProps>;
  const options = (p.options ?? []) as SingleChoiceOption[];
  const arrange = p.arrange ?? 'vert';

  const setOptions = (opts: SingleChoiceOption[]) =>
    updateQuestion(question.id, { props: { ...question.props, options: opts } });

  const setLabel = (i: number, label: string) =>
    setOptions(options.map((o, j) => (j === i ? { ...o, label } : o)));

  const del = (i: number) => {
    if (options.length <= 1) return; // 保底至少一项
    setOptions(options.filter((_, j) => j !== i));
    if (selectedOptIndex !== null && selectedOptIndex >= options.length - 1) {
      selectOption(options.length - 2);
    }
  };

  const addOption = () => {
    const next = [...options, { value: `opt${options.length + 1}`, label: `选项${options.length + 1}` }];
    setOptions(next);
    selectOption(next.length - 1);
  };

  // 原生 HTML5 拖拽:把 dragIndex 的项落到 dropIndex 前。
  const onDrop = (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) return;
    const next = [...options];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(dropIndex, 0, moved!);
    setOptions(next);
    selectOption(dropIndex);
    setDragIndex(null);
  };

  return (
    <>
      <div className={`opt-list ${arrange}`}>
        {options.map((opt, i) => (
          <div
            key={i}
            className={`opt-row${selectedOptIndex === i ? ' sel' : ''}${opt.style?.hidden ? ' opt-hidden' : ''}`}
            onClick={() => selectOption(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(i)}
          >
            <div className="opt-ed">
              <span
                className="drag"
                draggable
                title="拖拽排序"
                onDragStart={() => setDragIndex(i)}
                onDragEnd={() => setDragIndex(null)}
              >
                ⠿
              </span>
              {/* 单选=圆点记号,多选=方块记号(纯视觉,预览用) */}
              <span className={mode === 'multi' ? 'mk mk-check' : 'mk'} />
              <input
                className="oin"
                placeholder="选项文字"
                value={opt.label}
                // 所见即所得:右侧样式设置(颜色/字号/加粗)实时映射到中栏
                style={{
                  color: opt.style?.color,
                  fontSize: opt.style?.fontSize,
                  fontWeight: opt.style?.bold ? 700 : undefined,
                }}
                // 点/聚焦文本框也选中该项(切右栏「选项」tab);stopPropagation 防冒泡到题选中。
                onFocus={() => selectOption(i)}
                onClick={(e) => {
                  e.stopPropagation();
                  selectOption(i);
                }}
                onChange={(e) => setLabel(i, e.target.value)}
              />
              {opt.fill?.enabled && <span className="opt-flag">填空</span>}
              <button
                type="button"
                className="obtn del"
                title="删除选项"
                onClick={(e) => {
                  e.stopPropagation();
                  del(i);
                }}
              >
                ✕
              </button>
            </div>
            {opt.image?.url && (
              <img
                className="opt-thumb"
                src={opt.image.url}
                alt={opt.label}
                width={opt.image.w || undefined}
                height={opt.image.h || undefined}
                // 不带 Referer:规避 B 站等站点的防盗链(带 Referer 会被 403)
                referrerPolicy="no-referrer"
              />
            )}
            {opt.fill?.enabled && (
              <div className="opt-fill-prev">
                {opt.fill.desc && (
                  <div className="desc">
                    {opt.fill.required && <span className="fill-req">*</span>}
                    {opt.fill.desc}
                  </div>
                )}
                <div className="box">
                  {opt.fill.required && !opt.fill.desc && <span className="fill-req">*</span>}
                  {opt.fill.placeholder || '请填写…'}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="add-opt" onClick={addOption}>＋ 添加选项</div>
    </>
  );
}
