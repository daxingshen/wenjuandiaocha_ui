/** 矩阵多选作答态渲染。表格:行=子项,列=选项,单元格多选(checkbox)。 */
import type { AnswerProps } from '../types.js';
import { matrixWrapProps } from '../matrix-layout.js';
import type { MatrixMultiProps, MatrixMultiAnswer } from './handler.js';

export function MatrixMultiAnswerView({ question, value, onChange, disabled }: AnswerProps) {
  const p = question.props as Partial<MatrixMultiProps>;
  const rows = p.rows ?? [];
  const options = p.options ?? [];
  const ans: MatrixMultiAnswer =
    value && typeof value === 'object' && !Array.isArray(value) ? (value as MatrixMultiAnswer) : {};

  const toggle = (rowId: string, optValue: string) => {
    if (disabled) return;
    const raw = ans[rowId];
    const cur: string[] = Array.isArray(raw) ? raw : [];
    const next = cur.includes(optValue) ? cur.filter((v) => v !== optValue) : [...cur, optValue];
    onChange({ ...ans, [rowId]: next });
  };

  const wrap = matrixWrapProps(question.props);
  return (
    <div className={wrap.className} style={wrap.style}>
      <table className="matrix matrix-multi">
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
          {rows.map((row) => {
            const raw = ans[row.id];
            const cur: string[] = Array.isArray(raw) ? raw : [];
            return (
              <tr key={row.id}>
                <th scope="row">{row.label}</th>
                {options.map((opt) => (
                  <td key={opt.value}>
                    <input
                      type="checkbox"
                      checked={cur.includes(opt.value)}
                      disabled={disabled}
                      onChange={() => toggle(row.id, opt.value)}
                      aria-label={`${row.label} - ${opt.label}`}
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
