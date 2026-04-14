# r03 Resolution — 施工架构定稿

> Orchestrator: claude | 2026-04-14T18:00+08:00
> 参与: claude, gemini, glm, kimi, minimax, gpt (6/6 全员)

## 一、共识总结

六个 agent 在以下方向完全一致：
1. 安装器是**智能分发路由器**，不是桌面客户端
2. 包体尽量小、不打包 runtime，目标 ≤ 120MB（Electron 基础包约 ~90-100MB），只按需下载运行时
3. Path B 是 MVP 唯一必须真实闭环的路径
4. 网站在现有 `apps/web` 基础上改造，不重写
5. `react-router-dom` 加路由，4 个页面

核心分歧及裁决：

| 分歧 | 方案 A | 方案 B | 裁决 |
|------|--------|--------|------|
| 路径抽象 | PathHandler 接口（Gemini） | 配置 + 策略函数（GLM） | **GLM**。5 条路径逻辑差异太大，接口只会产生空实现 |
| 执行契约 | 每路径 1 个 execute()（GLM） | checkEnv/plan/run 三函数（GPT） | **GPT 折中**。3 函数但不做 interface，由 engine.ts 统一调度 |
| UI 步骤 | 两步决策（GLM） | 五步状态机（Kimi） | **折中**。quiz → preflight → provider → execute → complete，路径 A/E 只走 quiz |
| 网站结构 | Feature-based 拆分（Gemini） | 不拆，改内容（GLM） | **GLM**。496 行不需要拆 |
| Path C 策略 | 安装器内全自动（Kimi） | Windows 下载 FreeClaw exe（GPT） | **GPT**。Windows 直接下载 FreeClaw Release，macOS 回退 Path B |
| Path D 策略 | 安装器内 uv+pip（Kimi） | WSL2 指南 + 文档（GPT） | **GPT**。Windows 走指南，macOS/Linux 可执行脚本 |

## 二、安装器架构定稿

### 2.1 文件结构

```
apps/openclaw-installer/src/
├── main/
│   ├── index.ts                 # Electron main，注册 lobster:// 协议
│   ├── engine.ts                # 统一调度：调用 path 的 checkEnv/plan/run
│   ├── env/
│   │   └── detector.ts          # 环境检测（OS/Node/Python/Disk/GPU）
│   └── paths/
│       ├── vendor.ts            # Path A: openExternal(url)，10 行
│       ├── openclaw.ts          # Path B: Node 检测 + npm prefix install + gateway 启动
│       ├── freeclaw.ts          # Path C: 下载 FreeClaw Release / 引导
│       ├── hermes.ts            # Path D: uv + pip / WSL2 指南
│       └── wechat.ts            # Path E: 推荐 QClaw，跳转
├── renderer/
│   ├── App.tsx                  # 路由根
│   ├── store.ts                 # Zustand: selectedPath, step, envReport, progress
│   ├── components/
│   │   ├── WizardShell.tsx      # 复用现有 editorial 外壳
│   │   ├── QuizScreen.tsx       # Step 1: 选路径（四选一大卡片）
│   │   ├── VendorList.tsx       # Path A: 7 个大厂链接
│   │   ├── PreflightScreen.tsx  # Path B/C/D: 环境检测结果
│   │   ├── ProviderScreen.tsx   # Path B: API 配置引导
│   │   ├── ProgressScreen.tsx   # Path B/C/D: 安装进度 + 日志
│   │   └── CompleteScreen.tsx   # 完成 → 引导到社区网站
│   └── hooks/
│       └── useInstaller.ts      # IPC 封装
└── preload/
    └── index.ts                 # contextBridge
```

### 2.2 路径执行契约

```typescript
// 每条路径导出 3 个函数，不做 interface
// engine.ts 统一调度

// paths/[name].ts
export async function checkEnv(): Promise<EnvReport>
export function plan(env: EnvReport): InstallPlan  // 纯函数，返回要做的步骤列表
export async function run(
  plan: InstallPlan,
  onProgress: (step: string, percent: number, log: string) => void
): Promise<RunResult>

// 类型定义
interface EnvReport {
  os: { platform: 'mac' | 'win' | 'linux'; arch: string; version: string }
  nodejs: { installed: boolean; version: string | null; path: string | null }
  python: { installed: boolean; version: string | null }
  ollama: { installed: boolean; version: string | null }
  diskFreeGB: number
  gpu?: { name: string; vramMB: number }
  wsl2?: boolean  // Windows only
}

interface InstallPlan {
  steps: Array<{ id: string; label: string; estimate: string }>
  totalEstimate: string
  warnings: string[]
}

interface RunResult {
  success: boolean
  message: string
  nextAction: 'open-browser' | 'open-app' | 'show-guide' | 'none'
  nextUrl?: string
  logs?: string[]  // 失败时最后 50 行
}
```

### 2.3 Path B 最小闭环（MVP 验收线）

这是比赛 demo 必须跑通的路径：

1. **Windows 策略先说明**：OpenClaw 在 Windows 上优先走 **WSL2**（默认闭环路径）；“Windows 原生 Node 安装”仅作为实验选项，不作为 MVP 必达。
2. **Node 检测**：
   - macOS/Linux：系统 Node 满足要求则复用，否则下载便携 Node
   - Windows：优先检测 WSL2，后续在 WSL2 内使用 Linux 的 Node/npm；若用户强行选择原生路径，则下载便携 Node
3. **npm prefix 安装**：`npm install -g openclaw@latest --prefix=<userData>/runtime/npm-global`，不污染系统
4. **写配置**：生成最小 `~/.openclaw/openclaw.json`（或写入 `<userData>/runtime/openclaw/openclaw.json` 并通过 `OPENCLAW_CONFIG_PATH` 指向它）；API provider 从 ProviderScreen 获取
5. **启动 gateway**：`openclaw gateway --port <port> --verbose`，轮询 `http://127.0.0.1:<port>/` 直到可用
6. **验证成功**：打开浏览器访问 dashboard
7. **失败归因**：Node 版本不对 / 端口占用 / 网络不通 / 权限不足 → 展示日志 + 具体建议

### 2.4 其他路径策略

| 路径 | Windows | macOS | 工作量 |
|------|---------|-------|--------|
| A（大厂） | openExternal(url) | 同左 | 极小 |
| B（OpenClaw） | **默认 WSL2 闭环**（无 WSL2 则给指南）+ 可选原生实验路径 | 同左 | **大，MVP 核心** |
| C（FreeClaw） | 下载 FreeClaw Release exe 并运行 | 提示不支持离线，回退 B | 小 |
| D（Hermes） | WSL2 指南 + 文档链接 | uv + pip install + 脚本 | 中 |
| E（微信） | 推荐 QClaw → openExternal | 同左 | 极小 |

### 2.5 打包配置

```yaml
# electron-builder.yml
appId: com.lobster.dispatcher
productName: Lobster

mac:
  target: dmg
  arch: [x64, arm64]

win:
  target: nsis
  artifactName: "Lobster-Setup-${version}.${ext}"

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  perMachine: false  # 不需要管理员权限

extraResources:
  - from: "resources/bin"
    to: "bin"
    filter:
      - "uv*"
```

## 三、网站架构定稿

### 3.1 文件结构

```
apps/web/src/
├── main.tsx              # 不动
├── App.tsx               # 改造：加 BrowserRouter
├── index.css             # 不动
├── pages/
│   ├── Home.tsx          # 整合现有 Hero + Gallery + 下载区
│   ├── Templates.tsx     # ClawGo 模板市场
│   ├── Report.tsx        # /report 静态汇报页
│   └── Download.tsx      # /download 下载分发页
├── components/           # 现有保留，按需改造
│   ├── SiteNav.tsx       # 加路由链接
│   └── ...
└── hooks/
    └── useHubData.ts     # 保留
```

### 3.2 页面职责

| 页面 | 内容 | 数据源 |
|------|------|--------|
| `/` Home | Hero + 安装器下载 + 精选模板 | 静态 + shared registry |
| `/templates` | 分类侧边栏 + 卡片网格 + 搜索 + 复制安装码 | `@lobster/shared` LOBSTER_TEMPLATE_PACKAGES |
| `/report` | 项目定位 + 架构图 + 价值量化 + 落地场景 | 纯静态硬编码 |
| `/download` | 版本列表 + .dmg/.exe 下载 + 7 大厂链接 | GitHub Releases / 静态 |

### 3.3 /report 内容要求

- 一句话定位："企业 AI Agent 的统一安装桥"
- 简约架构图（安装器 → 模板中心 → 社区）
- 价值量化：实习生替代模型（1 人/月 × N 部门）
- 落地场景截图（可用虚拟数据）
- **不做动画**，纯静态，内容硬编码

## 四、共享数据层

### 4.1 packages/shared 改造

```
packages/shared/src/
├── lobster-registry.ts    # 现有，扩充到 10 个模板
├── vendor-registry.ts     # 新增：7 个大厂版信息
└── types.ts               # 扩展类型
```

### 4.2 vendor-registry.ts 结构

```typescript
export interface VendorInfo {
  id: string           // 'qclaw' | 'arkclaw' | ...
  name: string         // 'QClaw'
  vendor: string       // '腾讯'
  downloadUrl: string  // 官方下载页
  description: string  // 一句话说明
  features: string[]   // 特色功能
  requiresPlan: boolean // 是否需要付费 plan
}

export const VENDOR_REGISTRY: VendorInfo[] = [
  { id: 'qclaw', name: 'QClaw', vendor: '腾讯', ... },
  // ...7 个
]
```

## 五、任务分配（定稿）

| Agent | 角色 | 具体任务 | 产出 |
|-------|------|---------|------|
| **kimi** | Implementer | 安装器全部：路由 UI + engine.ts + 5 条路径 + 打包 | .dmg + .exe |
| **minimax** | Implementer | 网站：Home 改造 + Templates + /report + /download | 部署就绪 SPA |
| **glm** | Implementer | packages/shared：vendor-registry.ts + 模板扩充到 10 | 共享数据层 |
| **gemini** | Reviewer | 审查 kimi/minimax 代码产出，确保类型契约一致 | review comments |
| **gpt** | Devil's Advocate | 质疑弱网/杀软/权限场景，要求失败归因和降级方案 | review comments |
| **claude** | Orchestrator | 本 resolution + CODEX-PROMPT 更新 + 最终整合 | 项目文档 |

## 六、时间线

| 日期 | 里程碑 |
|------|--------|
| 4/15-16 | glm 交付 shared 数据层；kimi 开始安装器骨架 |
| 4/17-19 | kimi 完成 Path B 闭环 + 路由 UI；minimax 完成 Home + Templates |
| 4/20-21 | kimi 完成 Path A/C/D/E；minimax 完成 /report + /download |
| 4/22 | gemini + gpt review；集成测试 |
| 4/23-24 | Bug fix + 打包 + 录 demo 视频 |
| 4/25 | 提交 |

## 七、风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| Path B npm install 在公司内网被防火墙拦截 | demo 失败 | 准备离线 npm cache 兜底 |
| Windows 原生跑 OpenClaw 兼容性不稳定 | Path B 在 Win 上跑不通 | 默认走 WSL2；原生路径标注“实验”，失败时给出明确降级到 Path C/A/E |
| Electron 包体超 120MB | 下载慢 | afterPack 清理 + 不内置 runtime |
| /report 内容不够"震撼" | 汇报失分 | 用真实数据截图，不用 placeholder |
| 时间不够全部完成 | 功能缺失 | Path B + 网站 Home + /report 是底线，其余可降级 |

---

*本 resolution 为 r03 最终产出，后续施工以此为准。*
