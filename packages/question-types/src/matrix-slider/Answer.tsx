/**
 * 矩阵滑动条作答态渲染。无列:每行 行标签 + 原生 range 滑块 + 当前值。
 * 未拖动的行(答案无该键)显示「未设」并用未激活样式;拖动后写入数值。
 */
import type { AnswerProps } from '../types.js';
import { matrixWrapProps } from '../matrix-layout.js';
import type { MatrixSliderProps, MatrixSliderAnswer } from './handler.js';

export function MatrixSliderAnswerView({ question, value, onChange, disabled }: AnswerProps) {
  const p = question.props as Partial<MatrixSliderProps>;
  const rows = p.rows ?? [];
  const min = typeof p.min === 'number' ? p.min : 0;
  const max = typeof p.max === 'number' ? p.max : 100;
  const step = typeof p.step === 'number' && p.step > 0 ? p.step : 1;
  const ans: MatrixSliderAnswer =
    value && typeof value === 'object' && !Array.isArray(value) ? (value as MatrixSliderAnswer) : {};

  const set = (rowId: string, n: number) => {
    if (disabled) return;
    onChange({ ...ans, [rowId]: n });
  };

  const wrap = matrixWrapProps(question.props);
  return (
    <div className={wrap.className} style={wrap.style}>
      <table className="matrix matrix-slider">
        <tbody>
        {rows.map((row) => {
          const has = typeof ans[row.id] === 'number' && !Number.isNaN(ans[row.id]);
          const cur = has ? ans[row.id] : Math.round((min + max) / 2);
          return (
            <tr key={row.id}>
              <th scope="row" className="mtx-slider-label">
                {row.label}
              </th>
              <td>
                <div className="mtx-slider">
                  <span className="anchor">{min}</span>
                  <input
                    type="range"
                    className={has ? '' : 'unset'}
                    min={min}
                    max={max}
                    step={step}
                    value={cur}
                    disabled={disabled}
                    onChange={(e) => set(row.id, Number(e.target.value))}
                    aria-label={row.label}
                    aria-valuetext={has ? String(cur) : '未设'}
                  />
                  <span className="anchor anchor-max">{max}</span>
                  <span className={`val${has ? '' : ' unset'}`}>{has ? cur : '未设'}</span>
                </div>
              </td>
            </tr>
          );
          })}
        </tbody>
      </table>
    </div>
  );
}
