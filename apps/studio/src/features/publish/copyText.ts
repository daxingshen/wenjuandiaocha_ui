/**
 * 复制文本到剪贴板,带降级兜底。
 *
 * navigator.clipboard 仅在安全上下文(HTTPS / localhost)可用;dev 下用局域网 IP + HTTP
 * 打开 studio(vite 绑 0.0.0.0,见 vite.config)时它为 undefined,writeText 会抛错。
 * 故失败时降级到 document.execCommand('copy')——该老 API 不要求安全上下文,覆盖 HTTP 局域网场景。
 *
 * 返回是否复制成功(供调用方决定提示「已复制」还是「复制失败,请手动复制」)。
 */
export async function copyText(text: string): Promise<boolean> {
  // 优先用现代 Clipboard API(安全上下文下可靠、无副作用)。
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 落到 execCommand 兜底(权限被拒 / 非聚焦等场景)。
    }
  }
  return legacyCopy(text);
}

/** execCommand('copy') 兜底:临时 textarea + 选区,复制后移除。 */
function legacyCopy(text: string): boolean {
  if (typeof document === 'undefined') return false;
  const ta = document.createElement('textarea');
  ta.value = text;
  // 移出视口 + 只读,避免抢焦点滚动 / 软键盘弹出。
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.top = '-9999px';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  try {
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(ta);
  }
}
