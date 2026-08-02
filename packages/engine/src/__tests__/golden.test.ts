/**
 * 逻辑求值器「黄金测试」。向量固化在语言中立的 golden-vectors.json,前后端共享(决策 6)。
 * 本测试只是用前端实现跑一遍这批向量;后端用自己的语言读同一份 JSON 做验收,两端不漂移。
 * 修改逻辑语义时,先改 golden-vectors.json 再改实现——JSON 即契约。
 */
import { describe, expect, it } from 'vitest';
import { evaluate } from '../logic.js';
import type { Answers, LogicRule } from '../schema.js';
import golden from './golden-vectors.json' with { type: 'json' };

interface Vector {
  name: string;
  rules: LogicRule[];
  answers: Answers;
  expectHidden: string[];
}

const vectors = golden.vectors as Vector[];

describe('logic evaluate — 黄金向量(golden-vectors.json)', () => {
  it('至少覆盖一批向量', () => {
    expect(vectors.length).toBeGreaterThan(0);
  });

  for (const v of vectors) {
    it(v.name, () => {
      const { hidden } = evaluate(v.rules, v.answers);
      expect([...hidden].sort()).toEqual([...v.expectHidden].sort());
    });
  }
});
