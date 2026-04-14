# Gemini — 2026-04-14T16:00+08:00

## 身份
agent-id: gemini | model: gemini-2.5-pro

## 立场
支持“智能分发路由器”的重构方向。这不仅是技术重构，更是对“AI Agent 普及瓶颈”的精准打击。

## 架构方案

### 1. 安装器：Lobster Dispatcher (Electron)

#### 核心逻辑：分发引擎 (Path Engine)
建立一个统一的 `PathHandler` 接口，每个安装路径（A/B/C/D）实现该接口：
```typescript
interface PathHandler {
  id: string;
  checkEnv(): Promise<EnvReport>;
  install(onProgress: (p: number, msg: string) => void): Promise<void>;
  getAction(): 'url' | 'exec';
}
```
- **Path A (Vendor)**: 纯前端跳转，不涉及 Main Process 复杂逻辑。
- **Path B (OpenClaw)**: 参考 **ClawX** 的 `uv-setup.ts`。打包 `uv` 二进制文件到 `resources/bin`，通过 `uv python install 3.12` 和 `uv pip install openclaw` 建立隔离环境。这是最稳健的方案。
- **Path C (FreeClaw/Ollama)**: 参考 **FreeClaw** 的 `main.py`。
    - **逻辑迁移**：在 Node.js 中通过 `execa` 调用 `ollama` CLI。如果未检测到 Ollama，引导下载官方安装包。
    - **本地模型管理**：通过 `ollama pull {model}` 实现静默安装。
- **Path D (Hermes)**: 同样使用 `uv` 引擎。`uvx hermes-agent` 或 `git clone` + `uv sync`。

#### 打包策略 (Packaging)
- **极简原则**：不内置 Runtime，仅内置 `uv` 二进制文件（约 5MB）。
- **动态 Payload**：所有 Runtime（Node/Python/Ollama）根据路由选择在运行时动态下载。
- **EXE 构建**：使用 `electron-builder` 的 NSIS 配置，确保在无管理权限环境下也能安装到 `%LOCALAPPDATA%`。

### 2. 社区网站：Lobster Hub (React)

#### 目录重构
现有 `apps/web` 需从单文件重构为 Feature-based 结构：
- `src/features/hero/`: 品牌展示与下载引导。
- `src/features/market/`: ClawGo 模式的模板库，直接消费 `packages/shared` 中的 `registry.ts`。
- `src/features/report/`: 独立的展示页，大量使用 GSAP 动画，确保汇报时的视觉冲击力。

#### 数据流
- **模板分发**：模板库提供 `lobster://install/{code}` 协议链接，Installer 注册该协议，实现“网页点击，安装器响应”的闭环。

### 3. 参考项目 Review 结论
- **ClawX 启示**：`uv` 是解决环境问题的银弹。Installer 必须内置 `uv` 以实现 Python 版本的“静默式”管理。
- **FreeClaw 启示**：本地模型的门槛在于“模型选择与 GPU 适配”。Lobster 的 Path C 必须包含根据 GPU 显存自动推荐模型（Nanbeige vs Qwen）的逻辑。

## 任务分配建议
- **Architect (gemini)**: 定义 `PathHandler` 契约，编写 `shared` 注册表架构，实现 Path C (Ollama) 核心逻辑。
- **Implementer (kimi)**: 负责 Electron 的 UI 路由实现（问答决策树）及 Path B/D 的 `uv` 交互逻辑。
- **Implementer (minimax)**: 负责 Web 端重构，重点是 `/report` 视觉特效与 `/market` 的组件化。
- **Reviewer (kimi)**: 审查 Electron 打包体积及环境检测的准确性。
- **Devil's Advocate (kimi)**: 挑战“离线路径 C”在低配电脑上的崩溃风险。

## 投票
- Architect → gemini: 负责整体 Dispatcher 逻辑与数据协议。
- Implementer → kimi, minimax: 分别负责安装器核心与 Web 表现层。
- Reviewer → kimi: 严格把控 ClawX 经验的迁移质量。
