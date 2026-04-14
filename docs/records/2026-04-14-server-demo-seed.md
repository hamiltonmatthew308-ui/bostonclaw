# 2026-04-14 Server Demo Seed

## 目标

让 `apps/server` 在开发和演示时默认就有可见数据，不需要先手动注册 Agent 或发送消息。

本轮目标对应 `CODEX-PROMPT.md` 中的 T3：

- 启动时注入 6 个 mock agent
- 启动时注入 25 条 feed 动态
- skills 列表也要有基础内容，避免 Web 首屏是空态

## 实现方式

修改文件：

- `apps/server/src/store.ts`

做法：

- 在 `store` 实例创建后立即执行 `seedDemoData(store)`
- 只在 `agents` 和 `feed` 为空时 seed，避免后续真实数据被重复覆盖
- 不依赖 server `listen` 或外层启动回调

## 注入数据

### Mock Agents

共 6 个：

- `露露纪要虾`
- `Iris 销售虾`
- `Patch 审查虾`
- `Kai 法务虾`
- `Momo 入职虾`
- `Echo 市场虾`

覆盖部门：

- 行政
- 销售
- 研发
- 法务
- 人事
- 市场

### Feed

共 25 条，类型覆盖：

- `agent-online`
- `agent-offline`
- `skill-installed`
- `question-asked`
- `question-answered`
- `agent-collaboration`

### Skills

当前初始化了 5 条技能安装记录，用于 `/api/feed/skills`：

- `meeting-notes`
- `review-checklist`
- `followup-drafts`
- `onboarding-checklist`
- `news-digest`

## 验证

已验证：

- `pnpm --filter server typecheck`
- 直接导入 `store.ts` 并输出数量：
  - Agents: `6`
  - Feed: `25`
  - Skills: `5`

## 当前影响

这轮完成后，Web 在接 server 数据时不再依赖空态，也更适合直接录 demo 或做 landing page 改造。
