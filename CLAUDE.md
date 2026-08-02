# CLAUDE.md — 星卷问卷系统 前端(wenjuandiaocha_ui)

给 AI 助手的工作指南。本仓库是星卷问卷系统的前端。

## 项目一句话

一个 pnpm monorepo:框架无关的 **engine 内核**(纯 TS)+ 题型插件,被 **studio(工作台)** 和 **runtime(作答端)** 两个 React 应用共享。engine 承接 PRD §9 的全部硬约束。

架构决策的**结论与理由**在 wiki 的 `frontend.md`(七条已签署决策),动手前先读它。

## 仓库关系

- `../wenjuandiaocha` — 后端(技术栈未定)
- `../wenjuandiaocha_wiki` — 知识库(PRD / UI 规范 / 前端架构 / 原型)
- 本仓 = 前端

## 仓库结构

```
packages/
  engine/          # ★皇冠明珠:零框架依赖纯 TS(schema/logic/validate/normalize/registry)
  question-types/  # 题型插件,每种一个目录(handler + Editor.tsx + Answer.tsx + index.ts)
  ui/              # 设计 token(tokens.css,从原型搬)+ 通用组件
apps/
  studio/          # 工作台:看板/编辑器/预览/分析(登录);React 19 + Vite,端口 5173
  runtime/         # 作答端:公开/匿名/小/快/可嵌;React 19 + Vite,端口 5174
```

内部包 scope `@xingjuan/*`,用 `workspace:*` 互链,**不发布 npm**。

## 核心不变量(改代码时必须守住)

1. **engine 框架无关**:`packages/engine` 是纯 TS,零 React/框架依赖。别往里 import React。UI 行为(Editor/Answer 组件)住在 `question-types`,靠 `type` 字符串与 engine 的 handler 关联。
2. **加题型 = 零扩散**:新增一个题型只做两件事 —— 在 `packages/question-types/src/<type>/` 新建目录(handler + Editor + Answer + index),并在 `packages/question-types/src/index.ts` 的 `registerAll()` 里加一行。engine 与两个 app 一行都不改(PRD 约束 2「加题型零 DDL」的前端对应)。
3. **黄金向量即契约**:`packages/engine/src/__tests__/golden-vectors.json` 是逻辑求值器的前后端一致性契约。要改逻辑语义,**先改 JSON(加/改向量),再改 `logic.ts` 实现**,不能反过来。后端用自己的语言读同一份 JSON 做验收(见后端仓 CLAUDE.md)。
4. **engine 是纯函数,React 只渲染**:`evaluate` / `validateSurvey` / `normalizeSurvey` 都是纯函数。组件里用 `useMemo` 调它们(见 `apps/runtime/src/App.tsx` 的骨架链路),别把逻辑塞进组件。

## 关键代码入口

- 全链路参考:`apps/runtime/src/App.tsx` —— 加载 schema → 按 `type` 取组件渲染 → `evaluate` 隐藏题 → 提交时 `validateSurvey` + `normalizeSurvey`。studio 复用**同一个** Answer 组件做预览。
- 类型契约:`packages/engine/src/schema.ts`(Survey/Question/LogicRule/Condition/Answers)。
- 题型样板:`packages/question-types/src/single-choice/` —— 抄它加新题型。矩阵单选要早做,它会第一个顶爆简陋题型模型(PRD §4.1)。

## 本地开发

前置:Node ≥ 20;pnpm 由 `packageManager` 锁定 **11.18.0**(`corepack enable` 或 `npm i -g pnpm`)。

```bash
pnpm install                      # 安装并链接 workspace 内部包
pnpm dev:studio                   # 工作台 → http://localhost:5173
pnpm dev:runtime                  # 作答端 → http://localhost:5174
pnpm test                         # 全部包测试(含 engine 黄金向量,Vitest)
pnpm typecheck                    # 全量类型检查
pnpm build                        # 构建 studio + runtime
pnpm --filter @xingjuan/engine test   # 单独跑某包
```

改动后至少跑 `pnpm typecheck`;动了 engine/逻辑就跑 `pnpm --filter @xingjuan/engine test`。

## 工程约定(易踩)

- **ESM 相对 import 带 `.js` 后缀**(`moduleResolution: Bundler` + `verbatimModuleSyntax`)。写 `import ... from './schema.js'`,即便源文件是 `.ts`。照抄现有文件。
- **`noUncheckedIndexedAccess` 已开**:数组/索引访问返回 `T | undefined`,别假设非空。
- **pnpm 11 默认不跑依赖构建脚本**(供应链安全)。已在 `pnpm-workspace.yaml` 的 `allowBuilds` 放行 esbuild;新增需原生二进制的依赖时同样要放行。
- 状态管理倾向:studio 用 Zustand,runtime 用 `useReducer` + engine(见 frontend.md §11,实现时定稿)。图表 ECharts **仅 studio**,runtime 保持零图表依赖。

## 协作注意

- 用户方向偏后端、不熟前端:涉及前端决策时,从后端视角讲清「为什么」(frontend.md 各节都有类比,如 engine≈domain-core、monorepo≈Maven 多模块)。
- 选型/设计阶段先讨论方案 + 理由,用户明确敲定后才动手;小决策(命名/默认值)自己定并说明,scope 变更或破坏性操作先确认。
- 中文写作,与现有文档一致。
- 迁移/删除文件前先核对内容,不误伤。
