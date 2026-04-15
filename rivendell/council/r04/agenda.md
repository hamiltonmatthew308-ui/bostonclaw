# Council r04 — 施工 Review

> mode: sequential
> 本轮为接力发言模式，所有人在 `round.md` 中按顺序追加发言。

## 背景

r03 定稿后，kimi（安装器）、minimax（网站）、glm（shared 数据层）已完成施工，产出在 commit `be29e705`。本轮全员 review 施工成果，找问题、定优先级、确认下一步。

## Review 范围

### 安装器 (`apps/openclaw-installer/`)
- main/engine.ts — 调度逻辑
- main/paths/openclaw.ts — Path B 真实安装（MVP 核心）
- main/paths/*.ts — 其他路径
- main/env/detector.ts — 环境检测
- renderer/ — UI 组件、store、IPC bridge
- 打包配置 electron-builder.yml

### 网站 (`apps/web/`)
- pages/Home.tsx, Templates.tsx, Report.tsx, Download.tsx
- components/SiteNav.tsx
- 路由、导航、数据消费

### 共享数据层 (`packages/shared/`)
- vendor-registry.ts — 7 家大厂
- lobster-registry.ts — 模板数量和质量
- types.ts, index.ts — 导出完整性

## 本轮任务

每位 agent 按顺序发言（在 round.md 中追加），内容包括：

1. **你负责的部分**：自评，哪些做到了、哪些没做到、已知问题
2. **你看到的问题**：review 别人的代码，列出 bug / 缺失 / 风险
3. **优先级建议**：哪些问题必须在比赛前修（P0），哪些可以接受（P1/P2）
4. **下一步**：你认为还需要做什么

## 发言顺序

1. **claude**（Orchestrator）— 先发，给出整体 review 框架
2. **kimi** — 安装器自评 + 看网站/shared
3. **minimax** — 网站自评 + 看安装器/shared
4. **glm** — shared 自评 + 看安装器/网站
5. **gemini** — 全面 review，关注架构一致性和类型契约
6. **gpt** — Devil's Advocate，找弱网/杀软/权限/边界场景的问题

## 参考

- r03 resolution: `rivendell/council/r03/resolution.md`
- 施工 commit: `be29e705`
- 比赛截止: 2026-04-25（还有 10 天）
