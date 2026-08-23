import { describe, it, expect, vi, afterEach } from 'vitest';
import { copyText } from './copyText.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

/** 造一个最小 document 桩,记录 execCommand 是否被调用及移除清理。 */
function stubDocument(execResult: boolean) {
  const ta: Record<string, unknown> = {
    style: {},
    setAttribute: vi.fn(),
    select: vi.fn(),
    setSelectionRange: vi.fn(),
    value: '',
  };
  const appendChild = vi.fn();
  const removeChild = vi.fn();
  const execCommand = vi.fn(() => execResult);
  vi.stubGlobal('document', {
    createElement: () => ta,
    body: { appendChild, removeChild },
    execCommand,
  });
  return { ta, appendChild, removeChild, execCommand };
}

describe('copyText', () => {
  it('安全上下文:走 navigator.clipboard 并返回 true', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    vi.stubGlobal('document', undefined);

    expect(await copyText('hello')).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('无 clipboard(HTTP 局域网):降级到 execCommand', async () => {
    vi.stubGlobal('navigator', {});
    const { execCommand, ta, removeChild } = stubDocument(true);

    expect(await copyText('link')).toBe(true);
    expect(ta.value).toBe('link');
    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(removeChild).toHaveBeenCalled(); // 临时节点已清理
  });

  it('clipboard.writeText 抛错:回退 execCommand', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const { execCommand } = stubDocument(true);

    expect(await copyText('x')).toBe(true);
    expect(execCommand).toHaveBeenCalledWith('copy');
  });

  it('execCommand 失败:返回 false 且仍清理节点', async () => {
    vi.stubGlobal('navigator', {});
    const { removeChild } = stubDocument(false);

    expect(await copyText('x')).toBe(false);
    expect(removeChild).toHaveBeenCalled();
  });

  it('无 document 环境:返回 false', async () => {
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('document', undefined);

    expect(await copyText('x')).toBe(false);
  });
});
