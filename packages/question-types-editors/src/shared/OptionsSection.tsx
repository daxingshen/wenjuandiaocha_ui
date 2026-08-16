/**
 * 选项级富编辑(选项 tab):纵向平铺选项(点选 + 每行删 + 底部加)→ 选项标题 + 插入图片 + 允许填空 + 样式。
 * 单选与多选共用(选项结构同源 SingleChoiceOption = MultiChoiceOption);抽到 shared 避免两处漂移。
 * 宿主经 selectedOptIndex/onSelectOption 提供选中态(与画布内联编辑器双向同步)。
 */
import type { SingleChoiceOption } from '@xingjuan/question-types';
import '../editor.css';

export interface OptionsSectionProps {
  options: SingleChoiceOption[];
  setOptions: (opts: SingleChoiceOption[]) => void;
  setOpt: (i: number, next: Partial<SingleChoiceOption>) => void;
  selectedIndex: number | null;
  onSelect?: (index: number | null) => void;
}

export function OptionsSection({ options, setOptions, setOpt, selectedIndex, onSelect }: OptionsSectionProps) {
  // 选中下标兜底:宿主未提供或越界时落到第一项(与「总有一项在编辑」一致)。
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
        <label>选择选项</label>
        <div className="blank-picker">
          {options.map((o, i) => (
            <div key={i} className={`blank-pick${i === idx ? ' on' : ''}`}>
              <button type="button" className="blank-pick-label" onClick={() => onSelect?.(i)}>
                {o.label || `选项${i + 1}`}
              </button>
              <button
                type="button"
                className="del"
                title="删除此选项"
                disabled={options.length <= 1}
                onClick={() => delOption(i)}
              >
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="add-opt blank-add" onClick={addOption}>＋ 添加选项</button>
        </div>
      </div>

      {opt && <OptionBody opt={opt} index={idx} setOpt={setOpt} />}
    </div>
  );
}

interface OptionBodyProps {
  opt: SingleChoiceOption;
  index: number;
  setOpt: (i: number, next: Partial<SingleChoiceOption>) => void;
}

function OptionBody({ opt, index, setOpt }: OptionBodyProps) {
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
    </div>
  );
}
