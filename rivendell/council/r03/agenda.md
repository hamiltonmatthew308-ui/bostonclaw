# Council r03 — 施工架构讨论

> 本轮进入实际施工阶段。Ludviq 给出了全新的产品需求，和之前 CODEX-PROMPT.md 的设计有重大变化。请先读完本 agenda 再做任何判断。

## ⚠️ 重要变化：安装器不再是"合并两套 UI"

之前的 CODEX-PROMPT.md 是在现有代码基础上修补。Ludviq 现在给出的需求是一个**全新的智能分发路由器**——问几个问题，根据答案把用户导向不同的安装路径。这是重新设计，不是重构。

## 产品需求

### 一、安装器（Electron，需要产出 .dmg + .exe，exe 更重要）

#### 步骤 1：问答式分发路由

用户打开安装器后，通过几个问题决定走哪条路径：

**路径 A — "我要大厂封装版"（最轻）**
→ 直接跳转大厂自动安装器的下载链接。用户不需要在我们的安装器里装任何东西。
→ 需要说明：部分大厂版需要自己的 coding plan 或龙虾 plan。

我们链接的 7 个大厂版：
| 序号 | 名称 | 厂商 |
|------|------|------|
| 1 | QClaw | 腾讯 |
| 2 | ArkClaw | 字节 |
| 3 | AutoClaw | 智谱 |
| 4 | Kimi Claw | 月之暗面 |
| 5 | CoPaw | 阿里云 |
| 6 | DuClaw | 百度 |
| 7 | MaxClaw | MiniMax |

**路径 B — "我要原版 OpenClaw"（需要 API）**
→ 真实安装 OpenClaw runtime
→ 检测 Node.js 环境，必要时安装
→ 后续引导：API 申请（智谱免费 / SiliconFlow 等）
→ 可选：接入飞书或企业微信

**路径 C — "我要纯本地、不联网"（FreeClaw）**
→ 安装 FreeClaw（开源本地版）
→ 附带 Ollama 自动安装 + 本地大模型下载引导
→ 不需要 API，完全离线可用

**路径 D — "我不要龙虾，我要爱马仕"（Hermes Agent）**
→ 安装 Hermes Agent（git clone / pip install）
→ 检测 Python / Node 环境
→ Hermes Agent 有免费模型可用
→ GitHub: https://github.com/NousResearch/hermes-agent.git

**路径 E — "我需要接微信"**
→ 如果在问答中选了"需要接入微信" → 直接推荐 QClaw（腾讯版自带微信集成）

#### 步骤 2：教你怎么用
安装完成后，引导用户到社区网站学习使用方法。

#### 关键要求
- **做到最轻**——安装器本身要小，不要把所有 runtime 都打包进去
- **环境检测**——需要检测 OS、Node.js、Python、磁盘空间等（参考 ClawX）
- **必须产出 .dmg 和 .exe**，.exe 优先级更高

### 二、社区网站（React，现有 apps/web 基础上改）

#### 页面结构

**主页**
- Hero 区域：项目介绍 + 安装器下载链接（.dmg / .exe）
- 下载分发区：提供各版本下载入口

**ClawGo 模板市场**（可以是大 section 或子域名）
- 参考 clawgo.me 的模式
- 提供各种预封装的 prompt + skills 组合（"虾"）
- 一键复制安装码，员工粘贴到自己的 OpenClaw 即可使用
- 这里复用 `packages/shared` 的模板注册表

**`/report`**
- 纯静态汇报展示页（用于比赛）

**社区看板**
- 后续再做，本轮不讨论

## 参考项目（已解压，请 review）

请各 agent 在写 response 前 review 以下项目的代码，了解它们的架构和安装逻辑：

| 项目 | 路径 | 重点关注 |
|------|------|---------|
| **ClawX**（GUI 安装器） | `~/Downloads/ClawX-main/ClawX-main/` | 安装流程、环境检测、打包方式。有人觉得它太重，我们要更轻 |
| **FreeClaw**（本地版） | `~/Downloads/FreeClaw-main/FreeClaw-main/` | 本地模型安装逻辑、Ollama 集成 |
| **Hermes Agent** | `~/Downloads/hermes-agent-main/hermes-agent-main/` | 安装方式（git/pip/npm？）、免费模型支持 |
| **OpenClaw 原版** | `~/Downloads/openclaw-main/openclaw-main/` | 原版安装流程、依赖、配置 |
| **Lobster 现有代码** | `/Users/jouska/Projects/lobster-community/` | 当前 Installer/Web/Server/Shared 的实际状态 |
| **ClawGo**（在线模板市场） | https://clawgo.me | 网页参考，不开源，只看交互模式 |

## 本轮讨论焦点

### 1. 安装器的技术架构
- 问答路由的 UI 怎么设计？（决策树？向导？单页选择？）
- 不同路径的安装逻辑怎么隔离？（每个路径一个模块？统一 installer 引擎？）
- 环境检测要做到什么粒度？（参考 ClawX 但要更轻）
- 打包策略：Electron 本体多大？哪些 payload 打包进去，哪些运行时下载？
- .exe 用 NSIS 还是其他？.dmg 用 electron-builder 默认？

### 2. 网站的技术架构
- 现有 `apps/web` 496 行单文件，改造还是重写？
- `/report` 静态页用什么方案？（同一个 React app 的路由？独立 HTML？）
- ClawGo 模板市场和 `packages/shared` 的模板注册表怎么对接？
- 下载链接怎么管理？（GitHub Releases？自建 CDN？静态文件？）

### 3. 任务分配建议
Ludviq 指定：
- **Kimi Code** → 安装器（额度最多）
- **MiniMax** → 社区网站（额度最多）
- 其他 agent → 本轮提供架构建议，review 代码

但这不是最终分配——如果你认为有更合理的分工，请在 response 中说明。

## 参与规则

1. **必须先 review 参考项目代码**再写 response（至少读 ClawX 和 FreeClaw 的核心文件）
2. 读 `prev.md` 了解 r02 的结论
3. 按 Rivendell response 格式写到 `responses/[agent-id].md`
4. 重点输出：具体的技术方案（文件结构、数据流、组件设计），不要只给意见
5. 投票：Architect / Implementer / Reviewer 角色分配
6. **Orchestrator（claude）本轮不先发言**
