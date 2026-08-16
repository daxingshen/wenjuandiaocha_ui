/**
 * 单选题编辑态。按 section 分两段(对照原型右栏 题型 / 选项 两 tab):
 * - section='type':题型层设置 —— 选项随机排序 + 选项排列方式(竖/横/双列)。
 * - section='options':选项层设置 —— 共享 OptionsSection(选项选择器 + 标题 + 图片 + 填空 + 样式)。
 * - section 缺省:两段都渲染(向后兼容)。
 * 题干/必答/题型由 SettingsPanel 统一管;选项选中态由宿主经 selectedOptIndex/onSelectOption 提供。
 * 选项富编辑与多选同源,抽到 ../shared/OptionsSection(决策 D-1)。
 */
import type { EditorProps } from '@xingjuan/question-types';
import type { SingleChoiceArrange, SingleChoiceOption, SingleChoiceProps } from '@xingjuan/question-types';
import { OptionsSection } from '../shared/OptionsSection.js';
import '../editor.css';

const ARRANGE_OPTS: Array<{ v: SingleChoiceArrange; label: string }> = [
  { v: 'vert', label: '竖排' },
  { v: 'horiz', label: '横排' },
  { v: 'grid', label: '双列' },
];

export function SingleChoiceEditor({ question, onChange, section, selectedOptIndex, onSelectOption }: EditorProps) {
  const p = question.props as Partial<SingleChoiceProps>;
  const options = (p.options ?? []) as SingleChoiceOption[];
  const arrange = p.arrange ?? 'vert';
  const patch = (next: Partial<SingleChoiceProps>) => onChange({ props: { ...question.props, ...next } });
  const setOptions = (opts: SingleChoiceOption[]) => patch({ options: opts });
  const setOpt = (i: number, next: Partial<SingleChoiceOption>) =>
    setOptions(options.map((o, j) => (j === i ? { ...o, ...next } : o)));

  const showType = section === 'type' || section === undefined;
  const showOptions = section === 'options' || section === undefined;

  return (
    <>
      {showType && (
        <div className="set-group">
          <div className="toggle-row">
            <span>选项随机排序</span>
            <div className={`sw${p.randomize ? ' on' : ''}`} onClick={() => patch({ randomize: !p.randomize })} />
          </div>
          <label className="label-sm">选项排列方式</label>
          <div className="seg sm">
            {ARRANGE_OPTS.map((a) => (
              <button
                key={a.v}
                type="button"
                className={arrange === a.v ? 'on' : ''}
                onClick={() => patch({ arrange: a.v })}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {showOptions && (
        <OptionsSection
          options={options}
          setOptions={setOptions}
          setOpt={setOpt}
          selectedIndex={selectedOptIndex ?? null}
          onSelect={onSelectOption}
        />
      )}
    </>
  );
}
