/** 矩阵单选作答态渲染。runtime 与 studio 预览共用。表格:行=子项,列=选项,单元格单选。 */
import type { AnswerProps } from '../types.js';
import type { MatrixSingleProps, MatrixSingleAnswer } from './handler.js';

export function MatrixSingleAnswerView({ question, value, onChange, disabled }: AnswerProps) {
  const p = question.props as Partial<MatrixSingleProps>;
  const rows = p.rows ?? [];
  const options = p.options ?? [];
  const ans: MatrixSingleAnswer =
    value && typeof value === 'object' && !Array.isArray(value) ? (value as MatrixSingleAnswer) : {};

  const pick = (rowId: string, optValue: string) => {
    if (disabled) return;
    onChange({ ...ans, [rowId]: optValue });
  };

  return (
    <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
      <legend>{question.title}</legend>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th />
            {options.map((opt) => (
              <th key={opt.value} scope="col">
                {opt.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row" style={{ textAlign: 'left' }}>
                {row.label}
              </th>
              {options.map((opt) => (
                <td key={opt.value} style={{ textAlign: 'center' }}>
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
    </fieldset>
  );
}
