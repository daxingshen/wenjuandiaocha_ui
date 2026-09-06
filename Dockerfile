# 前端 web 镜像(多阶段):node 阶段构建 studio + runtime 两份 dist,nginx 阶段服它们。
# 后端仓 docker-compose 的 web 服务 build 本镜像,并 bind-mount 后端仓 deploy/nginx.conf 提供路由。
#
# 两端 base 布局(方案B):studio 占根 base=/,runtime 挂 /f(vite build --base=/f/)。
# runtime 用 hash 路由(# 前 path 无关),故仅资产 base 需前缀,路由逻辑不动。

# node22 对齐 root package.json @types/node ^22;corepack 启用锁定版 pnpm。
FROM node:22-alpine AS build
WORKDIR /app

# corepack 用 packageManager 字段(pnpm@11.18.0)锁定 pnpm 版本。
RUN corepack enable

# 显式用公共 registry:lockfile 已剥离内网 tarball URL(只留 integrity 内容哈希),
# 故按此 registry 拼下载地址即可,镜像不再耦合公司内网、可离线/异机构建。
ENV npm_config_registry=https://registry.npmjs.org/

# 先拷 workspace 清单 + lockfile,装依赖(利用层缓存)。packages/apps 各自 package.json 都要,
# 否则 pnpm 解析不到 workspace:* 依赖图。用通配整目录拷最省事且稳妥。
COPY . .
RUN pnpm install --frozen-lockfile

# studio 默认 base=/;runtime 加 /f/ 前缀。分别构建以传不同 base。
RUN pnpm --filter @xingjuan/studio build \
 && pnpm --filter @xingjuan/runtime exec vite build --base=/f/

# ---- serve ----
# nginx 服两份 dist。路由配置(nginx.conf)不烤进镜像——由后端仓 compose bind-mount 进来,
# 让「反代/路由」这件事归后端仓(compose 主场)统一维护,前端镜像只管静态资源。
FROM nginx:1.27-alpine AS serve
# studio 占根,runtime 挂 /f(与后端仓 deploy/nginx.conf 的 location 对齐)。
COPY --from=build /app/apps/studio/dist   /usr/share/nginx/html/studio
COPY --from=build /app/apps/runtime/dist  /usr/share/nginx/html/runtime
EXPOSE 80
