# Kimi — 2026-04-14 17:15 (Asia/Shanghai)
## 身份
agent-id: kimi | model: Kimi K2.6-code-preview

## 立场
主导（Implementer）。本轮安装器是施工核心，我额度最多且被 Ludviq 指定负责落地，方案以"可执行"为第一优先级。

## 要点
1. **必须放弃旧 SPEC.md 的"内置 bundle"假设**。ClawX 的 afterPack + bundle-openclaw.mjs 路线导致包体 120MB+ 且 pnpm/node_modules 打包极易踩坑，与 r03 "最轻"目标直接冲突。
2. **FreeClaw 的核心工程价值在于"按需下载 + prefix 安装 + 配置直写"**，这套逻辑应被抽象为路径 B/C 的共享执行引擎；但 FreeClaw 本身是 Windows-only 的 Python/Tkinter 程序，不能直接作为 Electron 子模块引入。
3. **现有 `apps/openclaw-installer` 的 6 步线性向导（场景→模板→Provider→安装）必须重构为"问答路由"**，但技术底座（Electron+Vite+React+Zustand）和 StepProvider/StepInstall/StepComplete 的 UI 资产可以复用，避免从零重写。
4. **路径 B（原版 OpenClaw）是唯一必须在本轮做到"真实安装闭环"的路径**，其它路径优先走"预检 + 跳转/引导"，这是最小可验收策略（MVP）。
5. **网站侧建议"改造不重写"**：`apps/web` 现有组件化基础够用，重点新增下载分发区和 `/report` 路由；ClawGo 模板市场对接到 `packages/shared` 的注册表即可。

---

## 建议

### 一、安装器总体架构：两层 + 五路分发

延续 GPT 提出的两层边界，但在现有 `apps/openclaw-installer` 内落地：

| 层 | 职责 | 禁止做的事 |
|---|---|---|
| **Renderer** | 收集用户答案、展示预检结果、展示进度/日志、渲染路由选择 | 不直接调用 `fs`/`spawn`/`shell.openExternal` 以外的系统 API；不硬编码安装逻辑 |
| **Main** | 环境检测、下载、解压、spawn、写配置、错误归因、进度推送 | 不维护 UI 状态机；只暴露 IPC 给 renderer |

核心数据契约（`src/shared/types/installer.ts`）：

```typescript
export type InstallRoute = 'A' | 'B' | 'C' | 'D' | 'E';

export interface RouteDecision {
  route: InstallRoute;
  os: 'win32' | 'darwin' | 'linux';
  arch: 'x64' | 'arm64';
  constraints: {
    offline: boolean;
    noAdmin: boolean;
    corpNetwork: boolean;
  };
  preference: {
    wantOEM: string | null;      // 大厂版 ID，如 'qclaw'
    wantLocalOnly: boolean;      // 是否纯本地
    wantWeChat: boolean;         // 是否必须接微信
  };
  // 仅 B/D 可能需要
  envSnapshot: {
    hasNode: boolean;
    hasPython: boolean;
    hasGit: boolean;
    hasWSL2: boolean;
    diskFreeMB: number;
  };
}
```

Renderer 的输出必须是这个结构；Main 的 `installer-engine.ts` 只认这个结构做分发。

---

### 二、文件结构改造（基于现有代码）

不建议新建 app，直接在 `apps/openclaw-installer` 内重构：

```
apps/openclaw-installer/
├── src/
│   ├── shared/
│   │   └── types/
│   │       └── installer.ts          # RouteDecision + progress types
│   ├── renderer/
│   │   ├── App.tsx                   # 改为 RouteWizard 容器
│   │   ├── store.ts                  # 替换 scenario/template 状态为 routeDecision + installProgress
│   │   ├── components/
│   │   │   ├── WizardShell.tsx       # 复用现有：步骤条 + 导航
│   │   │   ├── RouteQuiz.tsx         # 新：问答决策树（替换 StepScenario/StepTemplate）
│   │   │   ├── RouteA_OEM.tsx        # 大厂版列表 + 跳转按钮
│   │   │   ├── RouteB_OpenClaw.tsx   # 复用 StepInstall UI，但绑定 B 执行器
│   │   │   ├── RouteC_FreeClaw.tsx   # Windows 本地/Ollama 引导
│   │   │   ├── RouteD_Hermes.tsx     # 预检结果 + 一键执行/跳转
│   │   │   ├── RouteE_WeChat.tsx     # 强制推荐 QClaw
│   │   │   ├── StepProvider.tsx      # 复用现有：Provider 卡片 + Key 验证
│   │   │   └── StepComplete.tsx      # 复用现有：结果摘要 + 启动/打开社区
│   │   └── data/
│   │       ├── catalog.ts            # 改造：保留 Provider/Skills，新增 OEM_CATALOG
│   │       └── route-map.ts          # 新：决策树（问答 → route）
│   ├── main/
│   │   ├── ipc-handlers.ts           # 增加 installer:decide / installer:execute / installer:progress
│   │   └── modules/
│   │       ├── env-check.ts          # 增强版：加 Python/Git/WSL2 检测
│   │       ├── installer-engine.ts   # 新：核心分发器
│   │       ├── download-manager.ts   # 新：下载 + 校验 + 镜像回退 + 进度回调
│   │       ├── shell-runner.ts       # 新：跨平台 spawn / PATH 注入
│   │       ├── config-writer.ts      # 复用并简化现有逻辑
│   │       └── routes/
│   │           ├── a-oem.ts          # shell.openExternal(url)
│   │           ├── b-openclaw.ts     # 按需 Node + npm prefix + OpenClaw
│   │           ├── c-freeclaw.ts     # Windows：下载 FreeClaw exe 并 spawn
│   │           ├── d-hermes.ts       # git clone / setup-hermes.sh 引导
│   │           └── e-wechat.ts       # shell.openExternal(qclaw url)
│   └── tray/                         # 保留现有 gateway-manager 能力
│       ├── index.ts
│       └── gateway-manager.ts
├── electron-builder.yml              # 移除 extraResources bundle，瘦身
├── scripts/
│   └── download-bundled-node.mjs     # 保留但改为"构建时缓存"，供开发调试用
```

---

### 三、Renderer 数据流与组件设计

#### 1. 状态机改造（`store.ts`）

废弃 `scenarioId/templateId/inferredRuntimeId/inferredDeploymentId`，替换为：

```typescript
interface InstallerStore {
  currentStep: 'quiz' | 'preflight' | 'provider' | 'execute' | 'complete';
  routeDecision: RouteDecision | null;
  preflightResult: PreflightResult | null;
  installProgress: InstallProgress | null;
  // ...保留 providerConfigs / gatewayRunning 等
}
```

步骤流：
- **quiz** → 用户回答 3~4 个问题（是否接微信？是否纯本地？是否要大厂封装版？）
- **preflight** → 根据 decision 调用 `env:preflight(routeDecision)`，显示 OS/Node/Disk/Git 等检测结果
- **provider** → 仅路径 B/C/D 需要；A/E 跳过
- **execute** → 调用 `installer:execute(routeDecision)`，监听 `installer:progress` 事件
- **complete** → 显示结果 + 打开社区/打开 dashboard

#### 2. `RouteQuiz.tsx` 设计

采用决策树而非单页选择：

```tsx
const QUESTIONS = [
  {
    id: 'channel',
    question: '你希望通过什么方式使用 AI 助手？',
    options: [
      { label: '微信', next: 'E', decisionPatch: { wantWeChat: true } },
      { label: '企微/飞书/桌面端', next: 'Q2' },
    ],
  },
  {
    id: 'deployment',
    question: '你希望怎么部署？',
    options: [
      { label: '用大厂一键封装版（最轻）', next: 'A' },
      { label: '安装原版 OpenClaw（有 API 即可用）', next: 'B' },
      { label: '纯本地运行，不联网（需要本地 GPU）', next: 'C' },
      { label: '安装 Hermès Agent（开源免费模型）', next: 'D' },
    ],
  },
];
```

Renderer 只做状态收敛，最终生成 `RouteDecision` 后一次性发给 Main。

#### 3. 预检结果组件（新增 `PreflightPanel.tsx`）

根据 `routeDecision.route` 展示不同的必检项：
- A/E：只检 OS + Disk + 网络
- B：OS + Disk + Node（无则标黄"将自动下载"）+ 网络
- C：OS + Disk + 网络 + Windows 平台警告（macOS/Linux 不支持 C）
- D：OS + Disk + Python/uv + Git + 网络

---

### 四、Main 执行引擎设计

#### `installer-engine.ts` 核心接口

```typescript
export async function executeRoute(
  decision: RouteDecision,
  emit: (p: InstallProgress) => void
): Promise<InstallResult> {
  switch (decision.route) {
    case 'A': return await executeA(decision, emit);
    case 'B': return await executeB(decision, emit);
    case 'C': return await executeC(decision, emit);
    case 'D': return await executeD(decision, emit);
    case 'E': return await executeE(decision, emit);
  }
}
```

#### 路径 B（原版 OpenClaw）—— 本轮唯一必须闭环的"真安装"

借鉴 FreeClaw 思路，但改为 Electron 主进程实现，并吸收 GLM 的关键优化：

1. **Node.js 准备**
   - **优先复用系统 Node**：`which node` / `where node`
   - **次优复用 Electron 自带 Node**（GLM 建议）：通过 `ELECTRON_RUN_AS_NODE=1` 模式，安装器自己就能充当 Node 运行时来执行 `npm install -g openclaw`，省去额外下载 Node.js 的 30MB。ClawX 的 `resources/cli/win32/openclaw.cmd` 已经验证了该模式。
   - **兜底下载便携 Node**：若系统 Node 不可用且 Electron Node 模式遇到权限/路径问题，才调用 `download-manager.ts` 下载官方 Node 压缩包
     - Windows: `https://nodejs.org/dist/latest-v22.x/node-v22.x.x-win-x64.zip`
     - macOS: `node-v22.x.x-darwin-x64.tar.xz` 或 `arm64`
     - 下载到 `app.getPath('userData')/downloads/node/`，SHA256 校验后解压到 `userData/runtime/node`

2. **OpenClaw 安装**
   - 使用系统 Node 或刚解压的 Node，执行：
     ```bash
     npm install -g openclaw@latest --prefix "userData/runtime/npm-global"
     ```
   - 设置 `NPM_CONFIG_PREFIX` 环境变量，确保不需要管理员权限

3. **配置写入**
   - 写 `~/.openclaw/openclaw.json`（复用 `config-writer.ts`）
   - 注入用户在 StepProvider 配置的 API Key

4. **启动验证**
   - spawn `openclaw gateway run --port 18789`
   - `waitForHttpReady('http://127.0.0.1:18789', timeout=15)`
   - 成功后返回 `gatewayUrl`

**进度回调示例**：
- 5%  "检测 Node.js 环境"
- 20% "下载 Node.js 运行时（Windows x64）"
- 40% "安装 OpenClaw（npm prefix）"
- 60% "写入配置文件"
- 80% "启动 Gateway"
- 100% "完成"

#### 路径 C（FreeClaw / 纯本地）

- **Windows**：
  1. 检测是否有 Ollama；无则下载 `ollama-windows-amd64.zip`
  2. 下载 FreeClaw Release 的 `OpenClawPortableLauncher.exe` 到 `userData/downloads/`
  3. spawn 运行 FreeClaw exe，由它自行完成后续 Node/Ollama/模型下载
  4. 安装器只负责"分发 + 记录安装完成"
- **macOS/Linux**：
  不支持纯离线路径，preflight 阶段即拦截，提示回退到 B 或 A。

#### 路径 D（Hermès Agent）

- 预检 Python 3.11+/Git
- Windows：提示"WSL2 或 Git Bash 推荐"，默认行为是 `shell.openExternal('https://github.com/NousResearch/hermes-agent.git')` + 展示 setup 命令
- macOS/Linux：可选"一键执行 curl|bash 安装 uv + setup-hermes.sh"（需要用户勾选确认），默认也是先跳官方文档

#### 路径 A / E

纯路由，调用 `shell.openExternal(url)`，安装器本身不执行任何系统修改。

---

### 五、打包策略：最轻优先

**electron-builder.yml 改造**：

```yaml
productName: "Lobster Installer"
appId: com.lobster.installer
asar: true

# 关键：不再内置 OpenClaw/Node/Skills
extraResources:
  - from: "resources/"
    to: "resources/"
    filter:
      - "icons/**/*"
      - "tray-icons/**/*"

win:
  target: nsis
  icon: resources/icon.ico

nsis:
  oneClick: false
  perMachine: false
  allowElevation: false
  allowToChangeInstallationDirectory: true

mac:
  target: dmg
  icon: resources/icon.icns
```

**预估体积**：
- Electron runtime: ~65 MB
- UI assets: ~3 MB
- **Total: ~70 MB**（对比旧 SPEC 的 120 MB，显著变轻）

---

### 六、网站架构（`apps/web` 改造方案）

现有 `apps/web` 已经组件化（HeroSection / GettingStartedSection / TemplateLibrarySection / CommunityRadarSection），不建议重写。

#### 改造点：

1. **HeroSection 新增下载分发区**
   - 两个主按钮：下载 .exe（Windows）、下载 .dmg（macOS）
   - 次级入口："查看所有版本" → 滚动到 GettingStartedSection

2. **GettingStartedSection 改造为"版本分发区"**
   - 展示 5 条路径的入口卡片（A/B/C/D/E）
   - 每个卡片给出一句话描述 + 下载/跳转按钮
   - 数据从 `apps/web/src/data/downloads.ts` 读取（静态 JSON，方便 Ludviq 随时改链接）

3. **ClawGo 模板市场对接**
   - `TemplateLibrarySection` 现有逻辑已经使用 `useHubData`，建议把数据源从 mock 改为 `packages/shared` 的模板注册表
   - 如果 `packages/shared` 是 monorepo 本地包，web 项目可以直接 `import { registry } from '@lobster/shared'`
   - "一键复制安装码"功能已有 UI，只需把 `installCode` 从模板对象里取出来

4. **`/report` 静态汇报页**
   - **方案 A（推荐）**：在同一个 React app 里加路由 `/report`
     - 优点：共享样式和组件，部署简单
     - 实现：`react-router-dom` 加 `<Route path="/report" element={<ReportPage />} />`
     - 数据：静态 JSON (`report-data.json`)，Ludviq 赛前直接改数字
   - **打印优化**：给 `/report` 单独写 `@media print` 样式，确保答辩时可以直接浏览器打印成 PDF

---

### 七、任务分配投票

| 角色 | 投票给 | 理由 |
|---|---|---|
| **Architect** | gemini | 需要把"路由器 + 执行器"的边界、类型契约、IPC 协议定死；Gemini 的系统拆解更稳，能减少施工期返工。 |
| **Implementer** | kimi | 安装器涉及 Windows/NSIS/下载/spawn/权限等大量 dirty work，我的额度最多且被 Ludviq 指定；同时我对 FreeClaw 和 ClawX 的参考代码已逐行 review，能直接落地。 |
| **Reviewer** | gpt | GPT 在上轮已经展现出对"可验收标准"的强把控力，适合持续盯防"别又做成纯模拟 UI"，以及跨平台安全边界 review。 |

---

## 理由

我花了约 30 分钟逐行 review 了以下关键代码：

- **ClawX** 的 `electron-builder.yml` / `scripts/after-pack.cjs` / `scripts/bundle-openclaw.mjs`：确认"把 OpenClaw 塞进 Electron 包内"是一条高复杂度、高维护成本的路，与 r03 "最轻"约束冲突。
- **ClawX** 的 `src/pages/Setup/index.tsx`（RuntimeContent）：其环境检测逻辑是围绕"内置包是否存在 + Gateway 是否启动"设计的，不能直接复用到我们的"按需下载"模式。
- **FreeClaw** 的 `main.py`（第 500~1297 行）：深度理解了 `ensure_node`（zip 下载 + SHASUM 校验 + 镜像回退）、`ensure_openclaw`（npm prefix 安装）、`ensure_ollama`（GitHub Release 下载 + sha256 校验）、`configure_openclaw`（直写 JSON + token 生成 + gateway 启动）四个核心环节。这些逻辑是路径 B/C 执行器的最佳参考。
- **Lobster 现有代码** 的 `apps/openclaw-installer/SPEC.md` / `DEVLOG.md` / `src/renderer/App.tsx` / `src/renderer/store.ts` / `src/main/modules/{env-check,openclaw-installer,node-runtime}.ts`：确认项目脚手架完好，但旧 SPEC 的"内置 bundle"假设必须整体废弃；6 步线性向导必须重构为问答路由。
- **Hermes Agent** 的 `setup-hermes.sh`：确认其依赖 uv + Python 3.11，Windows 支持有限，路径 D 应采取"引导为主、自动化为辅"的策略。

基于以上事实，我的方案核心就是：**保留现有技术底座，废弃旧的重型安装假设，用 FreeClaw 的按需下载思路重构 Main 执行引擎，把 Renderer 改造成轻量问答路由器，MVP 只要求路径 B 真实闭环，其余路径先走分发/引导，确保比赛可录屏、可验收。**
