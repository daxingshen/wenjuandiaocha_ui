/** 量表题编辑态:编刻度范围 + 两端锚点文案。题干/必答/题型由 SettingsPanel 统一管。 */
import type { EditorProps } from '../types.js';
import type { ScaleProps } from './handler.js';

export function ScaleEditor({ question, onChange }: EditorProps) {
  const p = question.props as Partial<ScaleProps>;
  const patch = (next: Partial<ScaleProps>) => onChange({ props: { ...question.props, ...next } });

  return (
    <div className="set-group">
      <h5>刻度范围</h5>
      <div className="dual-field">
        <div className="field">
          <label>最小</label>
          <input type="number" value={p.min ?? 1} onChange={(e) => patch({ min: Number(e.target.value) })} />
        </div>
        <div className="field">
          <label>最大</label>
          <input type="number" value={p.max ?? 5} onChange={(e) => patch({ max: Number(e.target.value) })} />
        </div>
      </div>

      <h5>两端锚点</h5>
      <div className="field">
        <label>低端文案</label>
        <input type="text" value={p.minLabel ?? ''} onChange={(e) => patch({ minLabel: e.target.value || undefined })} />
      </div>
      <div className="field">
        <label>高端文案</label>
        <input type="text" value={p.maxLabel ?? ''} onChange={(e) => patch({ maxLabel: e.target.value || undefined })} />
      </div>
    </div>
  );
}
