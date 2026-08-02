/**
 * 选中题的逻辑规则编辑区。规则是问卷级(schema.rules),但从「目标题」视角编:
 * 列出 action.target === 选中题 的规则(「让本题在 …条件… 时显示/隐藏」)。
 *
 * 关键:条件编辑不认识具体题型——通过 engine 的 handler.logicRef(question) 拿到
 * 「可引用的子行(subId)与候选值」,矩阵子行在此自然露面,选项/刻度走下拉。不 hardcode 题型。
 */
import { getHandler, type Condition, type ConditionOp, type Question, type SurveySchema } from '@xingjuan/engine';
import { useEditorStore } from './useEditorStore.js';

/** op → 中文标签。answered/empty 不需要比较值。 */
const OPS: Array<{ op: ConditionOp; label: string; needValue: boolean }> = [
  { op: 'eq', label: '等于', needValue: true },
  { op: 'ne', label: '不等于', needValue: true },
  { op: 'includes', label: '包含(多选)', needValue: true },
  { op: 'gt', label: '大于', needValue: true },
  { op: 'lt', label: '小于', needValue: true },
  { op: 'answered', label: '已作答', needValue: false },
  { op: 'empty', label: '未作答', needValue: false },
];
const needValue = (op: ConditionOp) => OPS.find((o) => o.op === op)?.needValue ?? true;

export function LogicRules({ schema, targetQid }: { schema: SurveySchema; targetQid: string }) {
  const addRule = useEditorStore((s) => s.addRule);
  const updateRule = useEditorStore((s) => s.updateRule);
  const removeRule = useEditorStore((s) => s.removeRule);

  const rules = schema.rules.filter((r) => r.action.target === targetQid);
  // 可作为条件源的题:除目标题自己外的全部(避免自己显隐依赖自己)。
  const refQuestions = schema.questions.filter((q) => q.id !== targetQid);

  return (
    <div>
      <h5 style={{ margin: '0 0 8px' }}>逻辑规则</h5>
      <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: '0 0 10px' }}>
        满足条件时,显示/隐藏本题。
      </p>

      {rules.map((rule) => {
        const setConditions = (conditions: Condition[]) => updateRule(rule.id, { conditions });
        return (
          <div
            key={rule.id}
            style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 10, marginBottom: 10 }}
          >
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <select
                value={rule.action.type}
                onChange={(e) =>
                  updateRule(rule.id, { action: { ...rule.action, type: e.target.value as 'show' | 'hide' } })
                }
              >
                <option value="show">显示本题</option>
                <option value="hide">隐藏本题</option>
              </select>
              <span style={{ color: 'var(--ink-muted)' }}>当</span>
              <select
                value={rule.combinator}
                onChange={(e) => updateRule(rule.id, { combinator: e.target.value as 'AND' | 'OR' })}
              >
                <option value="AND">满足全部(AND)</option>
                <option value="OR">满足任一(OR)</option>
              </select>
              <button type="button" title="删除规则" style={{ marginLeft: 'auto' }} onClick={() => removeRule(rule.id)}>
                🗑
              </button>
            </div>

            {rule.conditions.map((cond, ci) => {
              const refQ = schema.questions.find((q) => q.id === cond.qid);
              const ref = refQ ? getHandler(refQ.type)?.logicRef?.(refQ) : undefined;
              const setCond = (patch: Partial<Condition>) =>
                setConditions(rule.conditions.map((c, j) => (j === ci ? { ...c, ...patch } : c)));

              return (
                <div key={ci} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                  {/* 引用哪道题;换题时清空 subId/value */}
                  <select
                    value={cond.qid}
                    onChange={(e) => setCond({ qid: e.target.value, subId: undefined, value: '' })}
                  >
                    {refQuestions.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.title || q.id}
                      </option>
                    ))}
                  </select>

                  {/* 子行(仅当引用题声明了 subFields,如矩阵) */}
                  {ref?.subFields && (
                    <select value={cond.subId ?? ''} onChange={(e) => setCond({ subId: e.target.value || undefined })}>
                      <option value="">(整题)</option>
                      {ref.subFields.map((sf) => (
                        <option key={sf.id} value={sf.id}>
                          {sf.label}
                        </option>
                      ))}
                    </select>
                  )}

                  <select value={cond.op} onChange={(e) => setCond({ op: e.target.value as ConditionOp })}>
                    {OPS.map((o) => (
                      <option key={o.op} value={o.op}>
                        {o.label}
                      </option>
                    ))}
                  </select>

                  {/* 比较值:有候选走下拉(保留原始类型),否则手输 */}
                  {needValue(cond.op) &&
                    (ref?.values ? (
                      <select
                        value={String(cond.value ?? '')}
                        onChange={(e) => {
                          const picked = ref.values!.find((v) => String(v.value) === e.target.value);
                          setCond({ value: picked ? picked.value : e.target.value });
                        }}
                      >
                        <option value="">(选择值)</option>
                        {ref.values.map((v) => (
                          <option key={String(v.value)} value={String(v.value)}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={String(cond.value ?? '')}
                        placeholder="比较值"
                        onChange={(e) => setCond({ value: e.target.value })}
                      />
                    ))}

                  <button
                    type="button"
                    title="删除条件"
                    onClick={() => setConditions(rule.conditions.filter((_, j) => j !== ci))}
                  >
                    ✕
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              disabled={refQuestions.length === 0}
              onClick={() => {
                const first = refQuestions[0];
                if (!first) return;
                setConditions([...rule.conditions, { qid: first.id, op: 'eq', value: '' }]);
              }}
            >
              ＋ 添加条件
            </button>
          </div>
        );
      })}

      <button type="button" onClick={() => addRule(targetQid)}>
        ＋ 添加逻辑规则
      </button>
    </div>
  );
}
