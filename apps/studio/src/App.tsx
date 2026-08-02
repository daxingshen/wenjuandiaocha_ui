/**
 * 工作台骨架:演示 studio 消费同一套 engine + question-types。
 * 左:题型面板(从 engine 注册表 listHandlers 列出);右:用与作答端相同的 Answer 组件做预览。
 * 证明「内核共享、外壳不同」:同一个题型渲染逻辑,两端一份。业务(看板/拖拽/分析)后续填。
 */
import { useState } from 'react';
import { listHandlers, type Question } from '@xingjuan/engine';
import { getUI } from '@xingjuan/question-types';

const DEMO_Q: Question = {
  id: 'q1',
  type: 'single-choice',
  title: '这是一道预览题',
  props: {
    options: [
      { value: 'a', label: '选项 A' },
      { value: 'b', label: '选项 B' },
    ],
  },
};

export function App() {
  const [value, setValue] = useState<unknown>(undefined);
  const ui = getUI(DEMO_Q.type);
  const Answer = ui?.Answer;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr', gap: 16, fontFamily: 'var(--font)', color: 'var(--ink)', padding: 16 }}>
      <aside>
        <h3>题型</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {listHandlers().map((h) => (
            <li key={h.type} style={{ padding: '4px 8px', border: '1px solid var(--line)', borderRadius: 8, marginBottom: 6 }}>
              {h.label} <small style={{ color: 'var(--ink-muted)' }}>({h.group})</small>
            </li>
          ))}
        </ul>
      </aside>
      <main>
        <h3>预览(与作答端同一渲染)</h3>
        {Answer ? <Answer question={DEMO_Q} value={value} onChange={setValue} /> : <p>题型未注册</p>}
        <p style={{ color: 'var(--ink-muted)' }}>当前值:{JSON.stringify(value)}</p>
      </main>
    </div>
  );
}
