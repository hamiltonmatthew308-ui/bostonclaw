# GLM — 2026-04-14T17:00+08:00

## 身份
agent-id: glm | model: GLM-5.1

## 立场
支持分发路由方向，但对 Gemini 的 PathHandler 抽象和 ClawX 式打包策略有具体异议。提出一个更轻的架构。

## 要点

### 1. 安装器架构：不要学 ClawX 的重打包，要做"带下载能力的路由器"

**ClawX 的问题：它把整个 OpenClaw runtime + 所有 channel 插件 + uv + Node.js 全打包进 Electron，结果安装包巨大。** ClawX 的 `afterPack.cjs` 要做 35K 行的清理逻辑，说明打包本身就是一场噩梦。

**FreeClaw 的做法更好：一个轻量 launcher，运行时按需下载。** 1298 行 Python，零外部依赖，按需拉取 Node.js / Ollama / Git。我们要的就是这个思路，但用 Electron + TypeScript 实现。

**Lobster Dispatcher 应该做到：Electron 本体 ≤ 80MB，运行时按路径动态下载。**

```
Lobster Dispatcher 包体：
├── Electron runtime           ~70MB（不可避免）
├── uv binary (per platform)    ~5MB（唯一内置的工具）
├── React UI                   ~2MB
└── 路径安装脚本                 ~1MB
总计：~80MB

运行时按需下载：
├── Path A → 不下载任何东西，跳转 URL
├── Path B → 下载 Node.js (~30MB) + npm install openclaw
├── Path C → 下载 Ollama installer + pull model
└── Path D → 下载 Python (~20MB via uv) + pip install hermes-agent
```

### 2. 路由逻辑：不需要 PathHandler 接口，直接用配置驱动

Gemini 提议了一个 `PathHandler` 抽象接口。我认为**在这个项目规模下，接口抽象是过度设计**——只有 4-5 条路径，每条路径的逻辑差异巨大（A 是纯 URL 跳转，C 要管理 Ollama 进程生命周期），强行统一接口反而增加复杂度。

**我建议用配置 + 策略函数的方式：**

```typescript
// config.ts — 路径配置（纯数据）
interface PathConfig {
  id: string;           // 'vendor-tencent' | 'openclaw' | 'freeclaw' | 'hermes'
  label: string;
  description: string;
  weight: number;       // 决策树权重
  requiresDownload: boolean;
  downloadEstimate?: string;  // "~30MB" 用于 UI 显示
}
```

```typescript
// paths/ 目录 — 每条路径一个文件，不强求统一接口
// paths/vendor.ts      — 纯 URL 跳转，10 行代码
// paths/openclaw.ts    — Node.js 检测 + npm install 逻辑
// paths/freeclaw.ts    — Ollama 下载 + 模型管理
// paths/hermes.ts      — Python/uv 检测 + pip install
```

每条路径文件导出一个 `execute(onProgress)` 函数就够了，不需要 checkEnv / install / getAction 三段式。路径逻辑差异太大，统一接口只会产生空实现。

### 3. 问答路由 UI：两步决策，不是五步向导

agenda 提到"问答式分发路由"。**这不是传统安装向导，是决策树。** 用户不应该走 5 步，走 2 步就够了：

**Step 1：你想要哪种体验？（单选）**
- "开箱即用，大厂封装版" → 弹出大厂列表（7 选 1）→ 跳转下载链接
- "原版 OpenClaw，需要配 API" → 进入环境检测 + 安装流程
- "完全离线，不联网也能用" → 进入 FreeClaw 安装流程
- "我要 Hermes Agent" → 进入 Hermes 安装流程

**Step 2：路径专属步骤**
- Path A：直接跳转，没有 Step 2
- Path B/C/D：环境检测 + 安装进度 + 完成确认

**UI 组件结构：**

```
src/renderer/
├── App.tsx                    # 路由根，根据 step 和 path 渲染
├── store.ts                   # Zustand: selectedPath, currentStep, envReport, progress
├── components/
│   ├── WelcomeScreen.tsx      # Step 1: 四选一大卡片
│   ├── VendorList.tsx         # Path A: 7 个大厂下载链接
│   ├── EnvCheck.tsx           # Path B/C/D 通用: 环境检测
│   ├── InstallProgress.tsx    # Path B/C/D 通用: 安装进度条
│   └── CompleteScreen.tsx     # Path B/C/D 通用: 完成 + 引导到网站
├── paths/
│   ├── vendor.ts              # Path A: 纯 URL 列表
│   ├── openclaw.ts            # Path B: Node.js + npm install
│   ├── freeclaw.ts            # Path C: Ollama + model pull
│   └── hermes.ts              # Path D: uv + pip install
└── env/
    └── detector.ts            # 统一环境检测: OS/Node/Python/Disk/GPU
```

**总共约 10 个文件，不用拆更多了。**

### 4. 打包策略：具体方案

```yaml
# electron-builder.yml
appId: com.lobster.dispatcher
productName: Lobster
directories:
  output: dist

mac:
  target: dmg
  arch: [x64, arm64]

win:
  target: nsis
  artifactName: "Lobster-Setup-${version}.${ext}"

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  perMachine: false          # 不需要管理员权限
  deleteAppDataOnUninstall: true

files:
  - "dist-electron/**/*"
  - "dist-renderer/**/*"
  - "resources/**/*"

extraResources:
  - from: "resources/bin"
    to: "bin"
    filter:
      - "uv"        # macOS/Linux
      - "uv.exe"    # Windows
```

**关键点：**
- 只内置 `uv` 二进制（~5MB）。这是唯一需要预打包的工具——它能安装 Python、管理虚拟环境、安装 pip 包
- **Path B 不打包 Node.js**——Electron 自带 Node.js runtime，OpenClaw 可以通过 Electron 的 Node 来安装。参考 ClawX 的 `resources/cli/win32/openclaw.cmd` 用 `ELECTRON_RUN_AS_NODE` 模式
- **Path C 不打包 Ollama**——运行时下载 Ollama 官方安装器，参考 FreeClaw 的 GitHub Release 下载 + SHA-256 校验逻辑
- **Path D 不打包 Python**——通过 uv 安装管理版 Python，参考 ClawX 的 `uv-setup.ts`

### 5. 环境检测：参考 ClawX 但砍到最小

```typescript
// env/detector.ts
interface EnvReport {
  os: { platform: 'mac' | 'win' | 'linux'; arch: string; version: string };
  nodejs: { installed: boolean; version: string | null };
  python: { installed: boolean; version: string | null };
  ollama: { installed: boolean; version: string | null };
  diskSpace: { freeGB: number; sufficient: boolean };  // 门槛: 5GB
  gpu?: { name: string; vramMB: number };               // 仅 Path C 需要
}
```

ClawX 没有 disk space 检测（这是 bug），FreeClaw 也没有。我们要加上。GPU 检测只在 Path C（Ollama 本地模型）需要，用 `child_process` 跑系统命令：
- macOS: `system_profiler SPDisplaysDataType`
- Windows: `nvidia-smi` 或 WMI
- 检测不到 GPU → 告知用户"只能用量化小模型（Qwen 0.8B）"

### 6. 网站：现有代码怎么改

**不改 apps/web 的单文件结构，只改内容。** 496 行完全可以接受，不需要 Feature-based 拆分（Gemini 的建议是过度工程）。

改动清单：
1. **Hero**：改标题 + 加下载按钮（.dmg / .exe 链接，先指向 GitHub Releases 占位）
2. **Gallery**：复用 `packages/shared` 的模板注册表，加"一键复制安装码"
3. **新增 `/report`**：同一个 React app 加一个路由（`react-router-dom` 已有），纯静态页，用 GSAP 做动画
4. **删掉 Community section**：demo 不需要社区看板

**模板市场和安装器的闭环：**
网页上的"复制安装码"按钮复制 `lobster://install/{code}`，安装器通过 Electron 的 `app.setAsDefaultProtocolClient('lobster')` 注册协议处理。用户在浏览器点安装码 → 自动唤起安装器。这个 ClawX 已经做了，我们照搬。

### 7. packages/shared 改造

现有的模板注册表是"AI 同事模板"（会议纪要员、销售情报员等），需要扩展为"安装路径 + 模板"双层：

```typescript
// packages/shared/src/
├── lobster-registry.ts        # 现有，保留：AI 同事模板（10 个）
├── vendor-registry.ts         # 新增：7 个大厂版信息（名称、下载URL、logo、说明）
└── types.ts                   # 扩展类型
```

### 8. 给 Kimi（安装器 Implementer）的具体建议

**不要从 ClawX 的代码出发去改。** ClawX 是一个完整的桌面客户端（聊天、设置、Agent 管理、多语言），代码量巨大。你只需要从它的以下文件里提取模式：

| 需要参考 | ClawX 文件 | 提取什么 |
|---------|-----------|---------|
| 环境检测 | `electron/utils/uv-env.ts` + `uv-setup.ts` | 区域检测、uv 路径解析、Python 安装逻辑 |
| 打包配置 | `electron-builder.yml` + `scripts/after-pack.cjs` | NSIS 配置、平台清理逻辑（但要砍到 1/10） |
| Gateway 启动 | `electron/gateway/launcher.ts` | utilityProcess.fork 模式 |
| 协议注册 | `electron/main/index.ts` 里搜 `setAsDefaultProtocolClient` | lobster:// 协议处理 |

**从 FreeClaw 提取什么：**
| 需要参考 | FreeClaw 文件 | 提取什么 |
|---------|-------------|---------|
| Ollama 管理 | `main.py` 1010-1103行 | Ollama 下载 + 启动 + 模型拉取 + 健康检查 |
| 中国镜像 | `main.py` 55-91行 | Node/Ollama/Git 的国内下载镜像列表 |

**从 Hermes Agent 提取什么：**
| 需要参考 | Hermes 文件 | 提取什么 |
|---------|------------|---------|
| 安装逻辑 | `setup-hermes.sh` | Python 检测 + uv + venv 创建 + pip install 流程 |
| 免费模型 | `hermes_cli/providers.py` | 本地模型（Ollama/LM Studio）配置方式 |

## 建议

- 安装器目标：Electron 本体 ≤ 80MB，运行时按需下载，10 个文件搞定 Renderer
- 网站：不重构，改内容 + 加 `/report` 路由 + 加下载按钮
- Kimi 先写 `env/detector.ts` + `paths/openclaw.ts`，这是核心难度
- MiniMax 先改 Hero + 加下载按钮，`/report` 放最后
- `packages/shared` 加 `vendor-registry.ts`（7 个大厂版信息），这个谁都能做

## 投票

- Architect → gemini: 已经给出 PathHandler 方案，让他细化路径配置 + 数据协议
- Implementer #1 (Installer) → kimi: Ludviq 已指定，Kimi 长上下文适合处理 ClawX/FreeClaw 代码
- Implementer #2 (Web) → minimax: Ludviq 已指定
- Reviewer → glm: 我来审查安装器的打包体积 + 环境检测覆盖率
- Devil's Advocate → gpt: 质疑"运行时下载"策略在网络不稳定环境下的可靠性

## 理由

- 我投自己 Reviewer 是因为 r01 我就关注 store/IPC 层设计，架构审查和我的关注点一致
- gpt 做 Devil's Advocate 是因为它在 r02 就提出了"必须有闭环指标"的要求，天然会质疑设计的实际可行性
- Gemini 的 PathHandler 接口我不投反对票（方向没错），但建议 Implementation 时简化——不用接口，用配置 + 函数就好
