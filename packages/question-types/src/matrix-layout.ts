/**
 * 矩阵题型共用的「表格布局」显示设置(所有矩阵题型通用,纯前端展示,不参与 validate/normalize)。
 * - firstColWidth:第一列固定宽度(px),默认 100。列过多时换行,不横向滚动(硬编码)。
 *
 * Answer(作答态)与 studio 画布编辑器都用 matrixWrapProps() 生成外层 .matrix-wrap 的 class/style,
 * 靠 CSS 变量 --mtx-c1 驱动首列宽。
 */

export interface MatrixLayout {
  firstColWidth?: number;
}

import type { CSSProperties } from 'react';

export interface MatrixWrapAttrs {
  className: string;
  /** 含 CSS 变量 --mtx-c1;用 CSSProperties 以便直接用于 JSX style。 */
  style: CSSProperties;
}

/** 从题目 props 读布局设置,产出 .matrix-wrap 的 className + style(含 --mtx-c1 变量)。 */
export function matrixWrapProps(props: unknown): MatrixWrapAttrs {
  const p = (props ?? {}) as MatrixLayout;
  const w = typeof p.firstColWidth === 'number' && p.firstColWidth > 0 ? p.firstColWidth : 100;
  return { className: 'matrix-wrap', style: { ['--mtx-c1']: `${w}px` } as CSSProperties };
}
