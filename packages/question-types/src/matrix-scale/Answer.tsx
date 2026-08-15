/** 矩阵量表作答态渲染。表格:行=子项,列=量级刻度,单元格单选;表头显示量级文案。 */
import type { AnswerProps } from '../types.js';
import { matrixWrapProps } from '../matrix-layout.js';
import type { MatrixScaleProps, MatrixScaleAnswer } from './handler.js';

export function MatrixScaleAnswerView({ question, value, onChange, disabled }: AnswerProps) {
  const p = question.props as Partial<MatrixScaleProps>;
  const rows = p.rows ?? [];
  const options = p.options ?? [];
  const ans: MatrixScaleAnswer =
    value && typeof value === 'object' && !Array.isArray(value) ? (value as MatrixScaleAnswer) : {};

  const pick = (rowId: string, optValue: string) => {
    if (disabled) return;
    onChange({ ...ans, [rowId]: optValue });
  };

  const wrap = matrixWrapProps(question.props);
  return (
    <div className={wrap.className} style={wrap.style}>
      <table className="matrix matrix-scale">
        <thead>
          <tr>
            <th scope="col" className="mtx-scale-corner" />
            {options.map((opt) => (
              <th key={opt.value} scope="col">
                <span className="mtx-scale-lbl">{opt.label}</span>
              </th>
            ))}
          </tr>
          <tr className="mtx-scale-scores">
            <th scope="col" className="mtx-scale-corner">分值</th>
            {options.map((opt) => (
              <th key={opt.value} scope="col">
                <span className="mtx-scale-score">{typeof opt.score === 'number' ? opt.score : ''}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row">{row.label}</th>
              {options.map((opt) => (
                <td key={opt.value}>
                  <input
                    type="radio"
                    name={`${question.id}:${row.id}`}
                    value={opt.value}
                    checked={ans[row.id] === opt.value}
                    disabled={disabled}
                    onChange={() => pick(row.id, opt.value)}
                    aria-label={`${row.label} - ${opt.label}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
