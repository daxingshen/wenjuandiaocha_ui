/**
 * 作答链接拼接(纯函数,便于单测)。
 *
 * runtime 用 hash 路由 #/s/:id(见 apps/runtime/src/App.tsx surveyIdFromHash)。
 * base 解析三级(见 deriveRuntimeBase):
 *   1) VITE_RUNTIME_BASE 显式配置 → 直接用(prod 异源部署 / 想钉死时的逃生口)。
 *   2) dev 未配置 → 用访问 studio 的 hostname + runtime 端口拼(谁用哪个 IP 访问,链接就用哪个 IP,
 *      故局域网其它设备扫码/点链接可作答;绝不写死 localhost)。
 *   3) prod 同源 → location.origin(studio 与 runtime 同源部署时正确)。
 */

/** dev 下 runtime 的固定端口(对齐 apps/runtime/vite.config.ts server.port)。 */
export const RUNTIME_DEV_PORT = 5174;

/** 拼作答链接。origin 参数化以便测试(默认读运行时 location)。 */
export function answerLink(id: string, runtimeBase?: string, origin?: string): string {
  const base = runtimeBase || origin || '';
  // 去掉 base 末尾斜杠,避免 //#
  const clean = base.replace(/\/+$/, '');
  return `${clean}/#/s/${id}`;
}

/**
 * 纯逻辑:按三级规则推导 runtime base。抽出以便单测(不碰真实 import.meta.env / location)。
 * dev 分支用 hostname(可能是 IP 或 localhost)+ runtime 端口,而非 studio 自己的 origin(异端口)。
 */
export function deriveRuntimeBase(input: {
  env?: string;
  dev: boolean;
  protocol: string;
  hostname: string;
  origin: string;
}): string {
  if (input.env) return input.env;
  if (input.dev) return `${input.protocol}//${input.hostname}:${RUNTIME_DEV_PORT}`;
  return input.origin;
}

/** 从环境 + location 解析 runtime base(薄封装,读真实环境后交给 deriveRuntimeBase)。 */
export function resolveRuntimeBase(): string {
  const loc = typeof location !== 'undefined' ? location : undefined;
  return deriveRuntimeBase({
    env: import.meta.env.VITE_RUNTIME_BASE,
    dev: import.meta.env.DEV,
    protocol: loc?.protocol ?? 'http:',
    hostname: loc?.hostname ?? '',
    origin: loc?.origin ?? '',
  });
}
