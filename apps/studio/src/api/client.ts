/**
 * studio 专属 HTTP 客户端(已鉴权,信任边界内)。
 * 后端栈与 api-contract.md 未定,base 先用占位;签约后接真接口。
 */
const BASE = import.meta.env.VITE_API_BASE ?? '/api';

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`GET ${path} 失败: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiSend<T>(path: string, method: 'POST' | 'PUT' | 'DELETE', body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} ${path} 失败: ${res.status}`);
  return res.json() as Promise<T>;
}
