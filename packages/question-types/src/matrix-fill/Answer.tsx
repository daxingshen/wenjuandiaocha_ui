/** 矩阵填空作答态渲染。无列:每行 行标签 + 文本输入。 */
import type { AnswerProps } from '../types.js';
import { matrixWrapProps } from '../matrix-layout.js';
import type { MatrixFillProps, MatrixFillAnswer } from './handler.js';

export function MatrixFillAnswerView({ question, value, onChange, disabled }: AnswerProps) {
  const p = question.props as Partial<MatrixFillProps>;
  const rows = p.rows ?? [];
  const ans: MatrixFillAnswer =
    value && typeof value === 'object' && !Array.isArray(value) ? (value as MatrixFillAnswer) : {};

  const setText = (rowId: string, text: string) => {
    if (disabled) return;
    onChange({ ...ans, [rowId]: text });
  };

  const wrap = matrixWrapProps(question.props);
  return (
    <div className={wrap.className} style={wrap.style}>
      <table className="matrix matrix-fill">
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row" className="mtx-fill-label">
                {row.label}
              </th>
              <td>
                <input
                  type="text"
                  className="cell-in"
                  value={typeof ans[row.id] === 'string' ? ans[row.id] : ''}
                  maxLength={p.maxLength}
                  placeholder={row.placeholder || '请填写…'}
                  disabled={disabled}
                  onChange={(e) => setText(row.id, e.target.value)}
                  aria-label={row.label}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
