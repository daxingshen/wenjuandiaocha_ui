/**
 * 数据分析页(仅 studio,约束 6 统计分离)。子 tab:题目统计 + 交叉分析。
 * 数据来自编辑器 store 的 schema 合成样本(演示;后端未接),经 engine normalize → aggregate 聚合,
 * 印证约束 4「答卷 → 规范化行 → 统计」链路。图表遵 dataviz(固定槽位色 + 图例)。
 */
import { useMemo, useState } from 'react';
import { getHandler } from '@xingjuan/engine';
import { useEditorStore } from '../editor/useEditorStore.js';
import { Chart, slotColors } from './Chart.js';
import { crosstab, mean, syntheticSample, tally, type Respondent } from './aggregate.js';

type SubTab = 'summary' | 'cross';

export function Analysis() {
  const schema = useEditorStore((s) => s.schema);
  const [sub, setSub] = useState<SubTab>('summary');
  // 合成一次样本(schema 变才重算):200 份演示答卷
  const sample = useMemo<Respondent[]>(() => (schema ? syntheticSample(schema, 200) : []), [schema]);

  if (!schema) return <p>未加载问卷</p>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: 'var(--font)', color: 'var(--ink)' }}>
      <div style={{ background: 'var(--brand-weak)', color: 'var(--brand)', textAlign: 'center', padding: '6px 12px', fontSize: 12, borderRadius: 8, marginBottom: 16 }}>
        演示数据(基于当前问卷合成 200 份样本,未连接后端)
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--line)', marginBottom: 22 }}>
        {(
          [
            ['summary', '题目统计'],
            ['cross', '交叉分析'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSub(key)}
            style={{
              padding: '10px 16px',
              fontWeight: 600,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: `2px solid ${sub === key ? 'var(--brand)' : 'transparent'}`,
              color: sub === key ? 'var(--brand)' : 'var(--ink-2)',
              marginBottom: -1,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {sub === 'summary' ? <Summary schema={schema} sample={sample} /> : <Cross schema={schema} sample={sample} />}
    </div>
  );
}

/** 值 → 人类可读标签:用题型 logicRef 的候选值 label 反查,回落原值。 */
function labelFor(schema: ReturnType<typeof useEditorStore.getState>['schema'], qid: string, value: string | number): string {
  const q = schema?.questions.find((x) => x.id === qid);
  const ref = q ? getHandler(q.type)?.logicRef?.(q) : undefined;
  const hit = ref?.values?.find((v) => String(v.value) === String(value));
  return hit?.label ?? String(value);
}

function Summary({ schema, sample }: { schema: NonNullable<ReturnType<typeof useEditorStore.getState>['schema']>; sample: Respondent[] }) {
  const colors = slotColors();

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {schema.questions.map((q) => {
        const ref = getHandler(q.type)?.logicRef?.(q);
        if (!ref?.values) {
          return (
            <div key={q.id} style={{ padding: 18, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}>
              <div style={{ fontWeight: 650 }}>{q.title}</div>
              <p style={{ color: 'var(--ink-muted)', fontSize: 12.5, marginTop: 8 }}>该题型暂无演示统计(文本/多选类)。</p>
            </div>
          );
        }

        // 矩阵:每子行一条均分条(subFields);标量单选/量表:整题分布
        const items = tally(sample, q.id);
        const isScale = q.type === 'scale';
        const m = mean(sample, q.id);

        return (
          <div key={q.id} style={{ padding: 18, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontWeight: 650 }}>{q.title}</div>
            <div style={{ color: 'var(--ink-muted)', fontSize: 12.5, marginBottom: 12 }}>
              {q.type} · 有效 {sample.length}
              {m !== null && ` · 均值 ${m.toFixed(2)}`}
            </div>
            <Chart
              option={{
                grid: { left: 90, right: 24, top: 10, bottom: 20 },
                xAxis: { type: 'value', splitLine: { lineStyle: { color: 'var(--line)' } } },
                yAxis: {
                  type: 'category',
                  data: items.map((it) => labelFor(schema, q.id, it.value)),
                  axisLine: { show: false },
                  axisTick: { show: false },
                },
                series: [
                  {
                    type: 'bar',
                    data: items.map((it) => it.count),
                    itemStyle: { color: isScale ? colors[2] : colors[0], borderRadius: [0, 4, 4, 0] },
                    barMaxWidth: 22,
                    label: {
                      show: true,
                      position: 'right',
                      formatter: (p) => `${(((p.value as number) / sample.length) * 100).toFixed(1)}%`,
                    },
                  },
                ],
              }}
              height={Math.max(120, items.length * 42 + 40)}
            />
          </div>
        );
      })}
    </div>
  );
}

function Cross({ schema, sample }: { schema: NonNullable<ReturnType<typeof useEditorStore.getState>['schema']>; sample: Respondent[] }) {
  // 只有标量单值题能做交叉(单选/量表);多值题不进选择器
  const crossable = schema.questions.filter((q) => {
    const ref = getHandler(q.type)?.logicRef?.(q);
    return ref?.values && !ref.subFields;
  });
  const [rowQid, setRowQid] = useState(crossable[0]?.id ?? '');
  const [colQid, setColQid] = useState(crossable[1]?.id ?? crossable[0]?.id ?? '');

  if (crossable.length < 2) {
    return <p style={{ color: 'var(--ink-muted)' }}>交叉分析需要至少两道单值题(单选 / 量表)。当前问卷不足。</p>;
  }

  const ct = crosstab(sample, rowQid, colQid);

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <span>行:</span>
        <select value={rowQid} onChange={(e) => setRowQid(e.target.value)}>
          {crossable.map((q) => (
            <option key={q.id} value={q.id}>{q.title}</option>
          ))}
        </select>
        <span style={{ color: 'var(--ink-muted)' }}>×</span>
        <span>列:</span>
        <select value={colQid} onChange={(e) => setColQid(e.target.value)}>
          {crossable.map((q) => (
            <option key={q.id} value={q.id}>{q.title}</option>
          ))}
        </select>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th style={cellStyle(true)} />
            {ct.colValues.map((cv) => (
              <th key={String(cv)} style={cellStyle(true)}>{labelFor(schema, colQid, cv)}</th>
            ))}
            <th style={cellStyle(true)}>合计</th>
          </tr>
        </thead>
        <tbody>
          {ct.rowValues.map((rv) => {
            const rowTotal = ct.rowTotals.get(String(rv)) ?? 0;
            // 找该行占比最高的列(对照原型:高亮最高占比单元格)
            let maxCol = '';
            let maxCount = -1;
            for (const cv of ct.colValues) {
              const c = ct.cells.get(String(rv))?.get(String(cv)) ?? 0;
              if (c > maxCount) (maxCount = c), (maxCol = String(cv));
            }
            return (
              <tr key={String(rv)}>
                <th style={{ ...cellStyle(true), textAlign: 'left' }}>{labelFor(schema, rowQid, rv)}</th>
                {ct.colValues.map((cv) => {
                  const c = ct.cells.get(String(rv))?.get(String(cv)) ?? 0;
                  const hot = String(cv) === maxCol && c > 0;
                  return (
                    <td key={String(cv)} style={{ ...cellStyle(false), background: hot ? 'var(--brand-weak)' : undefined }}>
                      <span style={{ fontWeight: 650, color: 'var(--ink)' }}>{c}</span>
                      <br />
                      {rowTotal === 0 ? '0%' : `${((c / rowTotal) * 100).toFixed(1)}%`}
                    </td>
                  );
                })}
                <td style={cellStyle(false)}>{rowTotal}</td>
              </tr>
            );
          })}
          <tr>
            <th style={{ ...cellStyle(true), textAlign: 'left' }}>合计</th>
            {ct.colValues.map((cv) => (
              <td key={String(cv)} style={cellStyle(false)}>{ct.colTotals.get(String(cv)) ?? 0}</td>
            ))}
            <td style={cellStyle(false)}>{ct.total}</td>
          </tr>
        </tbody>
      </table>
      <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 10 }}>高亮 = 该行占比最高的单元格。卡方检验待深度分析接入。</p>
    </div>
  );
}

function cellStyle(head: boolean): React.CSSProperties {
  return {
    padding: '10px 12px',
    border: '1px solid var(--line)',
    textAlign: 'center',
    background: head ? 'var(--surface-2)' : undefined,
    fontWeight: head ? 650 : 400,
    color: 'var(--ink-2)',
  };
}
