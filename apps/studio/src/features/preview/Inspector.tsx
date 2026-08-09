/**
 * 逻辑检查器(签名元素):读 derivePreview 的派生态,渲染完成度 + 逐题清单 + 校验回执。
 * 逐题清单灰显被逻辑隐藏的题(对齐原型,人已拍板);逻辑题标命中原因。
 */
import type { PreviewDerived } from './derive.js';
import type { PreviewState } from './usePreview.js';
import type { SurveySchema } from '@xingjuan/engine';

/** 判断某题是否受任一逻辑规则影响(用于给清单标"逻辑"原因)。 */
function isLogicTarget(schema: SurveySchema, qid: string): boolean {
  return schema.rules.some((r) => r.action.target === qid);
}

export function Inspector({
  schema,
  derived,
  state,
}: {
  schema: SurveySchema;
  derived: PreviewDerived;
  state: PreviewState;
}) {
  const { items, answeredCount, requiredTotal, pct } = derived;
  const miss = requiredTotal - answeredCount;
  const showWarn = state.submitted === 'blocked' || miss > 0;

  return (
    <div className="pv-inspect">
      <div className="card">
        <div className="pv-ihead">
          <h4>逻辑检查器</h4>
          <span className="tag">Logic</span>
        </div>
        <div className="pv-isub">作答时逐题求值,与作答端同一套引擎。</div>

        <div className="pv-meter">
          <span className="big">{answeredCount}</span>
          <span className="of">/ {requiredTotal}</span>
          <span className="pct">{pct}%</span>
        </div>
        <div className="pv-bar"><i style={{ width: `${pct}%` }} /></div>

        <div className="pv-qlist">
          {items.map((it) => {
            const logic = isLogicTarget(schema, it.q.id);
            const cls = it.isHidden ? 'hidden' : it.isAnswered ? 'done' : it.isRequired ? 'miss' : '';
            const why = it.isHidden ? '逻辑未命中 · 已隐藏' : logic ? '逻辑显示' : '';
            return (
              <div key={it.q.id} className={`pv-qrow ${cls}`}>
                <span className="st" />
                <span className="qn">
                  <b>Q{it.index + 1}</b> {it.q.title}
                  {it.isRequired && !it.isHidden && <span style={{ color: 'var(--critical)' }}> *</span>}
                  {why && <span className="why">{why}</span>}
                </span>
              </div>
            );
          })}
        </div>

        <div className={`pv-verdict ${showWarn ? 'warn' : 'ok'}`}>
          {showWarn ? `⚠ 还有 ${miss} 道必答题未完成` : state.submitted === 'ok' ? '✓ 校验通过,可提交' : '✓ 全部必答已完成'}
        </div>
      </div>
    </div>
  );
}
