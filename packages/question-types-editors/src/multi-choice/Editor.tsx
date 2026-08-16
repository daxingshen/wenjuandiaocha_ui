/**
 * 多选题编辑态。与单选对齐,按 section 分两段(右栏 题型 / 选项 两 tab):
 * - section='type':题型层设置 —— 数量限制(至少/最多) + 选项随机排序 + 选项排列方式(竖/横/双列)。
 * - section='options':选项层设置 —— 共享 OptionsSection(与单选同源:标题 + 图片 + 填空 + 样式)。
 * - section 缺省:两段都渲染(向后兼容)。
 * 题干/必答/题型由 SettingsPanel 统一管;选项选中态由宿主经 selectedOptIndex/onSelectOption 提供。
 */
import type { EditorProps } from '@xingjuan/question-types';
import type { MultiChoiceOption, MultiChoiceProps, SingleChoiceArrange } from '@xingjuan/question-types';
import { OptionsSection } from '../shared/OptionsSection.js';
import '../editor.css';

const ARRANGE_OPTS: Array<{ v: SingleChoiceArrange; label: string }> = [
  { v: 'vert', label: '竖排' },
  { v: 'horiz', label: '横排' },
  { v: 'grid', label: '双列' },
];

export function MultiChoiceEditor({ question, onChange, section, selectedOptIndex, onSelectOption }: EditorProps) {
  const p = question.props as Partial<MultiChoiceProps>;
  const options = (p.options ?? []) as MultiChoiceOption[];
  const arrange = p.arrange ?? 'vert';
  const patch = (next: Partial<MultiChoiceProps>) => onChange({ props: { ...question.props, ...next } });
  const setOptions = (opts: MultiChoiceOption[]) => patch({ options: opts });
  const setOpt = (i: number, next: Partial<MultiChoiceOption>) =>
    setOptions(options.map((o, j) => (j === i ? { ...o, ...next } : o)));
  const numOrUndef = (v: string) => (v === '' ? undefined : Number(v));
  // 「至少」下限为 2:多选设 min=1 与「必答单选」无异,故最小可设值锁 2。留空 = 不限。
  const minOrUndef = (v: string) => (v === '' ? undefined : Math.max(2, Number(v)));

  const showType = section === 'type' || section === undefined;
  const showOptions = section === 'options' || section === undefined;

  return (
    <>
      {showType && (
        <div className="set-group">
          <h5>选择数量限制</h5>
          <div className="dual-field">
            <div className="field">
              <label>最少</label>
              <input type="number" min={2} value={p.min ?? ''} onChange={(e) => patch({ min: minOrUndef(e.target.value) })} />
            </div>
            <div className="field">
              <label>最多</label>
              <input type="number" value={p.max ?? ''} onChange={(e) => patch({ max: numOrUndef(e.target.value) })} />
            </div>
          </div>

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
