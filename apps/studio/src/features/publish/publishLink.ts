/**
 * 作答链接拼接(纯函数,便于单测)。
 *
 * runtime 用 hash 路由 #/s/:id(见 apps/runtime/src/App.tsx surveyIdFromHash)。
 * base 优先取 VITE_RUNTIME_BASE(dev 下 studio:5173 与 runtime:5174 异端口,需显式指向 runtime);
 * 未配置回落当前 origin(prod 同源部署正确)。
 */

/** 拼作答链接。origin 参数化以便测试(默认读运行时 location)。 */
export function answerLink(id: string, runtimeBase?: string, origin?: string): string {
  const base = runtimeBase || origin || '';
  // 去掉 base 末尾斜杠,避免 //#
  const clean = base.replace(/\/+$/, '');
  return `${clean}/#/s/${id}`;
}

/** 从环境 + location 解析 runtime base(薄封装,便于组件调用)。 */
export function resolveRuntimeBase(): string {
  const env = import.meta.env.VITE_RUNTIME_BASE;
  if (env) return env;
  return typeof location !== 'undefined' ? location.origin : '';
}
