/**
 * 极小 ECharts React 封装(仅 studio,铁律:runtime 零图表依赖)。
 * 生命周期:init → setOption → resize(随容器)→ dispose。option 变即重设。
 */
import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

/** 从 CSS 变量取 dataviz 槽位色(固定顺序,不循环使用;UI 文档 §2.1)。 */
export function slotColors(): string[] {
  const css = getComputedStyle(document.documentElement);
  return ['--s1', '--s2', '--s3', '--s4', '--s5', '--s6', '--s7', '--s8'].map((v) =>
    css.getPropertyValue(v).trim(),
  );
}

export function Chart({ option, height = 220 }: { option: echarts.EChartsOption; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    chartRef.current = chart;
    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, true);
  }, [option]);

  return <div ref={ref} style={{ width: '100%', height }} />;
}
