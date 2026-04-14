# Council r01 — Architect 讨论

> 本轮从 Architect 阶段开始，不从 Concept 起步。项目概念已确定，需要讨论的是施工架构和任务分配。

## 项目概况

**Lobster Community** — 企业 AI Agent 标准化部署平台。帮 1500 人的公司把 AI Agent（OpenClaw）从"没人会装"推到"人人能用"。

pnpm monorepo，4 个 app + 1 个 shared package：

| 模块 | 技术栈 | 当前状态 |
|------|--------|---------|
| `apps/openclaw-installer` | Electron 40 + React 19 + Vite + Zustand | 有两套断裂的 UI 流程，需要合并重写 |
| `apps/web` | React 19 + Vite + GSAP | 单页落地页，能看但需要拆组件 + 视觉统一 |
| `apps/server` | Bun + Hono | 内存存储，API 全有，缺 seed 数据 |
| `apps/plugin` | TypeScript（OpenClaw 插件） | ✅ 已完成，不动 |
| `packages/shared` | TypeScript | 4 个模板，需扩到 10 个 |

## 核心问题

Installer 存在 **两套互不连通的 UI 流程**：

**Flow A（当前渲染）**：5 步咨询向导（scenario → runtime → template → deployment → plan），用 WizardShell 组件，暖白 editorial 设计风格，inline styles。

**Flow B（6 个 orphaned 组件）**：StepWelcome / StepInstall / StepProvider / StepWeCom / StepSkills / StepComplete，有完整 IPC 后端对接，但：
- 依赖不存在的 `WizardData` 类型
- 用 Tailwind 深色风格（cyan/slate/emerald），和 Flow A 视觉完全不同
- 从未被 App.tsx 引用

**任务**：合并为一套 6 步向导（Welcome → Scenario → Template → Provider → Install → Complete），重写 Step 组件的状态模型和视觉层，保留 IPC 调用逻辑。

## 已有施工计划（CODEX-PROMPT.md）

详见项目根目录 `CODEX-PROMPT.md`，包含 6 个 Task：

| Task | 内容 | 依赖 |
|------|------|------|
| T1 | 重写 Installer 渲染层（最大工作量） | 依赖 T2 |
| T2 | 扩充 shared 模板库（4→10 个） | 无依赖 |
| T3 | Server seed 演示数据 | 无依赖 |
| T4 | Web 落地页拆组件 + 视觉统一 | 依赖 T2 |
| T5 | demo.sh 启动脚本 + 录屏指南 | 依赖 T1/T3/T4 |
| T6 | 根 package.json scripts 修正 | 无依赖 |

## 本轮讨论焦点

### 1. 施工计划的架构合理性

CODEX-PROMPT.md 是否有遗漏、冲突或可优化的设计决策？特别关注：

- Zustand store 的状态结构设计（`inferredRuntimeId` / `inferredDeploymentId` 由模板推断而非用户选择——这个决策对不对？）
- 6 步向导的步骤划分是否合理（Skills 合并到 Template 步？还是保留独立步？）
- Demo mode 的实现策略（检测 `window.electron` 是否存在 + env 变量）
- 设计系统统一策略（Installer 暖白 editorial → Web 也改成一致？还是允许差异？）

### 2. 任务并行分配

6 个 agent 怎么分工？T2/T3/T6 无依赖，可以并行。T1 最重，需要拆子任务。T4 可以和 T1 并行但需要等 T2。

请各 agent 在 response 中：
- 评估施工计划，提出修改建议
- 认领你认为最适合的 Task（说明理由）
- 对有争议的设计决策投票

### 3. 开放议题

各 agent 如果对施工计划有新的思路或替代方案，请在 response 中提出。特别是 GPT（Codex）席位——Ludviq 在之前与 Codex 的协作中产生了新想法，请 GPT 席位在 response 中展开说明。

---

## 参与规则

1. 读完本 agenda 后，写你的 response 到 `responses/[your-agent-id].md`
2. 按 Rivendell 标准 response 格式（见 SKILL.md）
3. 必须包含：立场、要点、建议、投票（角色分配）
4. 在写 response 前先读 `CODEX-PROMPT.md` 了解完整施工计划
5. 本轮不需要读其他 agent 的 response，各自独立发表意见

## 需要分配的角色

| 角色 | 职责（本项目） |
|------|--------------|
| Architect | 审查整体架构，确认 store 设计、组件拆分、数据流 |
| Implementer × 2-3 | 执行 T1/T2/T3/T4 的代码工作 |
| Reviewer | 审查产出代码的质量、一致性、遗漏 |
| Devil's Advocate | 质疑设计决策，找漏洞 |

Orchestrator 固定 claude。其余角色请投票。
