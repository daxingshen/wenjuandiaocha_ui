/**
 * 单选题编辑态。按 section 分两段(对照原型右栏 题型 / 选项 两 tab):
 * - section='type':题型层设置 —— 选项随机排序 + 选项排列方式(竖/横/双列)。
 * - section='options':选项层设置 —— 选项选择器 + 选项标题 + 插入图片 + 允许填空 + 样式。
 * - section 缺省:两段都渲染(向后兼容)。
 * 题干/必答/题型由 SettingsPanel 统一管;选项选中态由宿主经 selectedOptIndex/onSelectOption 提供。
 */
import type { EditorProps } from '@xingjuan/question-types';
import type { SingleChoiceArrange, SingleChoiceOption, SingleChoiceProps } from '@xingjuan/question-types';
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

interface OptionsSectionProps {
  options: SingleChoiceOption[];
  setOptions: (opts: SingleChoiceOption[]) => void;
  setOpt: (i: number, next: Partial<SingleChoiceOption>) => void;
  selectedIndex: number | null;
  onSelect?: (index: number | null) => void;
}

function OptionsSection({ options, setOptions, setOpt, selectedIndex, onSelect }: OptionsSectionProps) {
  // 选中下标兜底:宿主未提供或越界时落到第一项(与原型「总有一项在编辑」一致)。
  const idx = selectedIndex !== null && selectedIndex >= 0 && selectedIndex < options.length ? selectedIndex : 0;
  const opt = options[idx];

  const addOption = () => {
    const next = [...options, { value: `opt${options.length + 1}`, label: `选项${options.length + 1}` }];
    setOptions(next);
    onSelect?.(next.length - 1);
  };
  const delOption = (i: number) => {
    if (options.length <= 1) return; // 保底至少一项
    const next = options.filter((_, j) => j !== i);
    setOptions(next);
    onSelect?.(Math.min(idx, next.length - 1));
  };

  return (
    <div className="set-group">
      <div className="field">
        <label>操作的选项</label>
        <select value={idx} onChange={(e) => onSelect?.(Number(e.target.value))}>
          {options.map((o, i) => (
            <option key={i} value={i}>{o.label || `选项${i + 1}`}</option>
          ))}
        </select>
      </div>

      {opt && <OptionBody opt={opt} index={idx} setOpt={setOpt} onDelete={() => delOption(idx)} />}

      <button type="button" className="add-opt" onClick={addOption}>＋ 添加选项</button>
    </div>
  );
}

interface OptionBodyProps {
  opt: SingleChoiceOption;
  index: number;
  setOpt: (i: number, next: Partial<SingleChoiceOption>) => void;
  onDelete: () => void;
}

function OptionBody({ opt, index, setOpt, onDelete }: OptionBodyProps) {
  const style = opt.style ?? {};
  const fill = opt.fill;
  const image = opt.image;

  return (
    <div id="opt-body">
      <div className="field">
        <label>选项标题</label>
        <input type="text" value={opt.label} onChange={(e) => setOpt(index, { label: e.target.value })} />
      </div>

      {/* 插入图片:占位 URL + 尺寸(原型为「选择图片」按钮,此处以 URL 输入承载,后续接上传) */}
      <details className="fold">
        <summary className="fold-head"><span>插入图片</span><span className="chev">›</span></summary>
        <div className="fold-body">
          <div className="field">
            <label>图片地址</label>
            <input
              type="text"
              placeholder="https://…"
              value={image?.url ?? ''}
              onChange={(e) =>
                setOpt(index, { image: { url: e.target.value, w: image?.w ?? 120, h: image?.h ?? 120 } })
              }
            />
          </div>
          <label className="label-sm">图片尺寸(px)</label>
          <div className="dual">
            <div className="field" style={{ margin: 0 }}>
              <label>宽</label>
              <input
                type="number"
                min={0}
                value={image?.w ?? 120}
                onChange={(e) =>
                  setOpt(index, { image: { url: image?.url ?? '', w: Number(e.target.value), h: image?.h ?? 120 } })
                }
              />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>高</label>
              <input
                type="number"
                min={0}
                value={image?.h ?? 120}
                onChange={(e) =>
                  setOpt(index, { image: { url: image?.url ?? '', w: image?.w ?? 120, h: Number(e.target.value) } })
                }
              />
            </div>
          </div>
        </div>
      </details>

      {/* 允许填空 */}
      <div className="toggle-row">
        <span>允许填空</span>
        <div
          className={`sw${fill?.enabled ? ' on' : ''}`}
          onClick={() => setOpt(index, { fill: { ...fill, enabled: !fill?.enabled } })}
        />
      </div>
      {fill?.enabled && (
        <div className="sub-fill">
          <div className="field">
            <label>填空描述</label>
            <input
              type="text"
              placeholder="例:请注明具体用途"
              value={fill.desc ?? ''}
              onChange={(e) => setOpt(index, { fill: { ...fill, desc: e.target.value } })}
            />
          </div>
          <div className="field">
            <label>输入框提示文字</label>
            <input
              type="text"
              placeholder="请填写…"
              value={fill.placeholder ?? ''}
              onChange={(e) => setOpt(index, { fill: { ...fill, placeholder: e.target.value } })}
            />
          </div>
          <div className="toggle-row" style={{ border: 'none', padding: 0 }}>
            <span>填空必填</span>
            <div
              className={`sw${fill.required ? ' on' : ''}`}
              onClick={() => setOpt(index, { fill: { ...fill, required: !fill.required } })}
            />
          </div>
        </div>
      )}

      {/* 样式设置 */}
      <details className="fold">
        <summary className="fold-head"><span>样式设置</span><span className="chev">›</span></summary>
        <div className="fold-body">
          <div className="toggle-row">
            <span>文字颜色</span>
            <input
              type="color"
              className="color-in"
              value={style.color ?? '#1a1a1a'}
              onChange={(e) => setOpt(index, { style: { ...style, color: e.target.value } })}
            />
          </div>
          <div className="dual" style={{ marginTop: 10 }}>
            <div className="field" style={{ margin: 0, flex: 1.4 }}>
              <label>字号大小(px)</label>
              <input
                type="number"
                min={8}
                max={48}
                value={style.fontSize ?? 14}
                onChange={(e) => setOpt(index, { style: { ...style, fontSize: Number(e.target.value) } })}
              />
            </div>
          </div>
          <div className="toggle-row" style={{ marginTop: 6 }}>
            <span>加粗</span>
            <div
              className={`sw${style.bold ? ' on' : ''}`}
              onClick={() => setOpt(index, { style: { ...style, bold: !style.bold } })}
            />
          </div>
          <div className="toggle-row" style={{ border: 'none' }}>
            <span>隐藏此选项</span>
            <div
              className={`sw${style.hidden ? ' on' : ''}`}
              onClick={() => setOpt(index, { style: { ...style, hidden: !style.hidden } })}
            />
          </div>
        </div>
      </details>

      <button type="button" className="obtn del" title="删除选项" onClick={onDelete} style={{ marginTop: 12 }}>
        ✕ 删除此选项
      </button>
    </div>
  );
}
