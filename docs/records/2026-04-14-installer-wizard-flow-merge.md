# 2026-04-14 Installer Wizard Flow Merge

## 背景

根据 `CODEX-PROMPT.md` 的 T1 目标，installer 需要从旧的 5 步字符串向导切到新的 6 步数字流程，并把已经重写过的 step 组件真正接入主流程，形成可演示的完整闭环。

本轮重点不是继续做 UI 概念，而是把向导结构、状态层和执行路径接起来，并保持平台中性，不把逻辑锁死在 macOS。

## 本轮施工内容

### 1. 合并主流程

- 重写 `apps/openclaw-installer/src/renderer/App.tsx`
- 旧的 `scenario / runtime / template / deployment / plan` 字符串流程被替换成 6 步数字流程：
  - `0 环境准备`
  - `1 使用场景`
  - `2 模板中心`
  - `3 模型接入`
  - `4 安装执行`
  - `5 完成交付`
- `App.tsx` 现在只负责：
  - 注入步骤定义
  - 从 store 读取全局状态
  - 组装 sidebar 摘要
  - 按当前 step 渲染对应页面

### 2. WizardShell 改成数字步骤导航

- 重写 `apps/openclaw-installer/src/renderer/components/WizardShell.tsx`
- 取消对旧 `WizardStep` 字符串 union 的依赖
- `steps` / `currentStep` / `stepIcons` 改成 number-based
- 侧边栏保留 `Copper Editorial` 风格，但导航逻辑与新 store 一致

### 3. 新 step 真正接入 store

以下 step 已经接入新的 Zustand store 并参与主流程：

- `StepWelcome`
- `StepScenario`
- `StepTemplate`
- `StepProvider`

这些页面不再依赖旧 `WizardData`。

### 4. 重写安装与完成页

重写文件：

- `apps/openclaw-installer/src/renderer/components/StepInstall.tsx`
- `apps/openclaw-installer/src/renderer/components/StepComplete.tsx`

#### StepInstall

- 接到新的 store
- 支持 Demo Mode
- 真实模式下串行执行：
  - `install:start`
  - `skills:install`
  - `agent:import`
- 进度条和阶段卡片由 store 驱动

#### StepComplete

- 接到新的 store
- 支持 Demo Mode
- 真实模式下串行执行：
  - `config:write`
  - `service:start`
- 将 `configWritten / gatewayRunning / gatewayUrl / completionError` 回写到 store

### 5. 平台中性

本轮没有把路径、平台判断或按钮文案写死到 macOS：

- `App.tsx` 只读取 `envCheck.os.platform`
- `StepWelcome` 展示 `Windows / macOS / Linux / 演示环境`
- 向导逻辑不依赖 `.dmg`、`.app` 或 shell-only 假设

这意味着后续做 Windows `.exe` 版本时，主要工作还是主进程模块和打包配置适配，不需要重做 renderer。

## 关联文件

### 新增 / 重写

- `apps/openclaw-installer/src/renderer/App.tsx`
- `apps/openclaw-installer/src/renderer/components/WizardShell.tsx`
- `apps/openclaw-installer/src/renderer/components/StepInstall.tsx`
- `apps/openclaw-installer/src/renderer/components/StepComplete.tsx`

### 本轮一起修正

- `apps/openclaw-installer/src/renderer/components/StepScenario.tsx`
- `apps/openclaw-installer/src/renderer/components/StepTemplate.tsx`
- `apps/openclaw-installer/src/renderer/components/StepProvider.tsx`
- `apps/openclaw-installer/src/renderer/components/StepWelcome.tsx`

## 验证结果

已通过：

- `pnpm --filter lobster-installer typecheck`
- `pnpm --filter lobster-installer build:vite`

## 当前状态

installer renderer 侧已经形成一个完整的 6 步闭环，可用于演示：

1. 环境检查
2. 场景判断
3. 模板选择
4. provider 接入
5. 安装执行
6. 最终写入与服务启动

下一步可以继续做：

- T3 server seed
- T4 web 重构与视觉统一
- T5 demo 脚本与录屏路径
