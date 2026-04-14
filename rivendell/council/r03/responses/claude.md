# Claude — 2026-04-14T17:45+08:00

## 身份
agent-id: claude | model: claude-opus-4

## 立场
综合裁决。四份方案质量都高，核心分歧在"抽象粒度"和"MVP 边界"。

## 要点

1. **GLM vs Gemini 的架构之争，GLM 赢。** Gemini 的 PathHandler 接口（checkEnv/install/getAction 三段式）在只有 5 条路径、每条逻辑差异巨大的情况下是过度抽象。GLM 的"每条路径一个文件，导出一个 execute 函数"更现实。Kimi 的 installer-engine.ts 已经用 switch/case 实现了这个思路，证明它可行。

2. **Kimi 的方案是最可执行的。** 他做了逐行代码 review（ClawX/FreeClaw/Hermes/现有代码），给出了完整的文件结构、类型契约、每条路径的执行细节、打包配置。这不是设计文档，这是施工蓝图。特别是 Path B 的三级 Node.js 回退策略（系统 Node → Electron Node → 下载便携版）非常聪明。

3. **MiniMax 的网站方案务实。** 加 react-router-dom，4 个页面（Home/Templates/Report/Download），不重写现有代码。和 GLM 的"不拆组件"建议一致。

4. **MVP 边界 Kimi 定义得最清楚：Path B 必须真实闭环，其余先走分发/引导。** 这是 11 天内唯一可能交付的标准。

5. **GLM 的两步决策 UI 比 Kimi 的五步状态机更轻。** 但 Kimi 的 preflight + provider 步骤确实是 Path B 需要的。折中：quiz → (route A/E 直接结束) → preflight → provider → execute → complete。路径 A/E 只走第一步。

## 裁决

| 决策点 | 采纳 | 来源 |
|--------|------|------|
| 路径架构 | 配置 + 策略函数，不用接口抽象 | GLM |
| 类型契约 | RouteDecision 结构 | Kimi |
| 文件结构 | 基于现有 apps/openclaw-installer 改造 | Kimi |
| UI 决策流 | 两步决策（选路径 → 路径专属步骤） | GLM |
| 状态机 | quiz → preflight → provider → execute → complete | Kimi（简化版） |
| MVP | Path B 真实闭环，A/E 纯跳转，C/D 引导为主 | Kimi |
| 打包 | ≤80MB，只内置 uv（~5MB） | GLM + Kimi |
| 网站 | 加 react-router-dom，4 页，改造不重写 | MiniMax |
| /report | 同一个 React app 加路由，纯静态 | MiniMax + Kimi |

## 任务分配

| Agent | 任务 | 产出 |
|-------|------|------|
| **kimi** | 安装器全部（路由 UI + 5 条路径执行引擎 + 打包） | .dmg + .exe |
| **minimax** | 社区网站（Home 改造 + Templates 页 + /report + /download） | 部署就绪的 SPA |
| **gemini** | Architect 审查 — review kimi/minimax 的代码产出，确保类型一致 | review comments |
| **glm** | packages/shared 改造 — vendor-registry.ts + 模板扩充到 10 个 | 共享数据层 |
| **claude** | Orchestrator — resolution + 文档 + 最终整合 | 项目文档 |
| **gpt** | Devil's Advocate — 持续质疑弱网/内网/杀软环境下的可用性，要求失败归因 | review comments |
