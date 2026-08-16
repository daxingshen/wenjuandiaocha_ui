/**
 * 下拉框编辑态,按 section 分两段:
 * - section='type':题型层设置 —— 选项随机排序。
 * - section='options':选项层设置 —— 选项行增删改 + 「默认选中」选择器。
 * - section 缺省:两段都渲染(向后兼容)。
 * 题干/必答/题型由 SettingsPanel 统一管。画布走展开式内联编辑(DropdownCanvasPreview)。
 */
import type { EditorProps } from '@xingjuan/question-types';
import type { DropdownOption, DropdownProps } from '@xingjuan/question-types';
import '../editor.css';

export function DropdownEditor({ question, onChange, section }: EditorProps) {
  const p = question.props as Partial<DropdownProps>;
  const options = (p.options ?? []) as DropdownOption[];
  const patch = (next: Partial<DropdownProps>) => onChange({ props: { ...question.props, ...next } });
  const setOptions = (opts: DropdownOption[]) => patch({ options: opts });

  const showType = section === 'type' || section === undefined;
  const showOptions = section === 'options' || section === undefined;

  const setLabel = (i: number, label: string) =>
    setOptions(options.map((o, j) => (j === i ? { ...o, label } : o)));
  const del = (i: number) => {
    if (options.length <= 1) return; // 保底至少一项
    const removed = options[i];
    setOptions(options.filter((_, j) => j !== i));
    // 删掉的正是默认项 → 清空默认。
    if (removed && p.defaultValue === removed.value) patch({ options: options.filter((_, j) => j !== i), defaultValue: undefined });
  };
  const add = () =>
    setOptions([...options, { value: `opt${options.length + 1}`, label: `选项${options.length + 1}` }]);

  return (
    <>
      {showType && (
        <div className="set-group">
          <div className="toggle-row">
            <span>选项随机排序</span>
            <div className={`sw${p.randomize ? ' on' : ''}`} onClick={() => patch({ randomize: !p.randomize })} />
          </div>
        </div>
      )}

      {showOptions && (
        <div className="set-group">
          <h5>选项</h5>
          {options.map((opt, i) => (
            <div key={i} className="opt-row">
              <input type="text" value={opt.label} onChange={(e) => setLabel(i, e.target.value)} />
              <button type="button" className="del" title="删除" onClick={() => del(i)}>
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="add-opt" onClick={add}>
            ＋ 添加选项
          </button>

          <div className="field" style={{ marginTop: 14 }}>
            <label>默认选中</label>
            <select
              value={p.defaultValue ?? ''}
              onChange={(e) => patch({ defaultValue: e.target.value === '' ? undefined : e.target.value })}
            >
              <option value="">（无默认）</option>
              {options.map((o, i) => (
                <option key={i} value={o.value}>
                  {o.label || `选项${i + 1}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </>
  );
}
