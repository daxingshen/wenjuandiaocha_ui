/** 多行文本 handler 单测:validate(文本/maxLength)与 normalize。 */
import { describe, expect, it } from 'vitest';
import type { Question } from '@xingjuan/engine';
import { textareaHandler } from '../handler.js';

const makeQ = (props: Record<string, unknown> = {}): Question => ({
  id: 'q1',
  type: 'textarea',
  title: '建议',
  props,
});

describe('textareaHandler.normalize', () => {
  it('非空文本产出一行', () => {
    expect(textareaHandler.normalize(makeQ(), '多行\n内容')).toEqual([
      { qid: 'q1', value: '多行\n内容' },
    ]);
  });

  it('空串产出空数组', () => {
    expect(textareaHandler.normalize(makeQ(), '')).toEqual([]);
  });
});

describe('textareaHandler.validate', () => {
  it('文本通过', () => {
    expect(textareaHandler.validate(makeQ(), 'ok')).toBeNull();
  });

  it('非文本被拒', () => {
    expect(textareaHandler.validate(makeQ(), 123)).toBe('答案格式应为文本');
  });

  it('超长被拒', () => {
    expect(textareaHandler.validate(makeQ({ maxLength: 2 }), 'abc')).toBe('不超过 2 个字符');
  });

  it('过短被拒', () => {
    expect(textareaHandler.validate(makeQ({ minLength: 5 }), 'abc')).toBe('至少 5 个字符');
  });

  it('缺省字段(旧问卷)照常通过', () => {
    expect(textareaHandler.validate(makeQ(), '任意多行文本')).toBeNull();
  });
});
