/**
 * 矩阵单选编辑态。按 section 分段(右栏 题型 / 选项 两 tab):
 * - section='type':矩阵单选无题型级配置(题干/提示/必答由 SettingsPanel 统一管)。
 * - section='options':行(子项)增删改 + 列(选项)增删改。
 * - section 缺省:全渲染(向后兼容)。与中栏 MatrixCanvasEditor 改同一份 props,双向同步。
 */
import type { EditorProps, MatrixSingleProps, MatrixLayout } from '@xingjuan/question-types';
import { RowsEditor, ColsEditor, MatrixLayoutFields } from './shared.js';

export function MatrixSingleEditor({ question, onChange, section }: EditorProps) {
  const p = question.props as Partial<MatrixSingleProps> & MatrixLayout;
  const rows = p.rows ?? [];
  const options = p.options ?? [];
  const patch = (next: Record<string, unknown>) => onChange({ props: { ...question.props, ...next } });

  const showType = section === 'type' || section === undefined;
  const showOptions = section === 'options' || section === undefined;

  return (
    <>
      {showType && (
        <MatrixLayoutFields firstColWidth={p.firstColWidth} onChange={patch} />
      )}
      {showOptions && (
        <>
          <RowsEditor rows={rows} setRows={(r) => patch({ rows: r })} />
          <ColsEditor options={options} setOptions={(o) => patch({ options: o })} />
        </>
      )}
    </>
  );
}
