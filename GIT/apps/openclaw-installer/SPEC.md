OpenClaw Installer - Implementation Specification
Context
公司正在推行全员 AI，但约 1500 名员工大多不熟悉命令行操作。需要一个可视化的桌面安装工具，让员工能一键安装和配置 OpenClaw（基于 ClawX 项目），通过企业微信等渠道以"智能助手"方式使用 AI。核心目标：员工下载 EXE → 点击安装 → 按引导配置 → 在企微里直接用 AI技术底座：ClawX — 一个成熟的 Electron + OpenClaw 桌面应用项目位置：/Users/jouska/lobster-community/apps/openclaw-installer/（monorepo 内新增 app）
Architecture Overview
plaintext
┌─────────────────────────────────────────────┐
│           OpenClaw 安装向导 (EXE)            │
│                                             │
│  Electron + React 19 + TypeScript           │
│  6步引导 → 安装 → 配置 → 启动后台服务         │
└─────────────────┬───────────────────────────┘
                  │ 安装完成后
                  ▼
┌─────────────────────────────────────────────┐
│          系统托盘常驻程序 (Tray App)           │
│                                             │
│  管理 OpenClaw Gateway 生命周期              │
│  状态监控 + 自动重启 + 开机自启               │
└─────────────────┬───────────────────────────┘
                  │ 运行中
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
 企微 Bot      CLI 终端     配置 Clone
(每人一个)    (高级用户)    (共享配置)
每个员工在自己 Windows 电脑上安装，每人独立运行 OpenClaw 实例。WeCom 插件使用客户端 outbound 连接模式，个人电脑在内网/NAT 后也能正常工作。
Tech Stack
Layer	Technology	Rationale
Framework	Electron 40+	与 ClawX 一致，复用其打包方案
UI	React 19 + Tailwind CSS + shadcn/ui	与 ClawX 一致
Bundler	Vite + vite-plugin-electron	快速开发和构建
Language	TypeScript 5.x	全栈类型安全
State	Zustand	轻量状态管理，与 ClawX 一致
Packaging	electron-builder (NSIS)	成熟的 Windows EXE 打包方案
Testing	Vitest	与 monorepo 一致
Wizard Flow (6 Steps)
Step 1: Welcome + Environment Check
UI: 欢迎页，自动扫描系统环境，底部有"导入配置"入口检查项:
操作系统版本 (Windows 10+)
磁盘空间 (>=500MB)
Node.js 检测（已装则提示，未装则使用内置版本）
已有 OpenClaw 安装检测（提供升级/全新安装选择）
可选：企业代理设置
模块: src/main/modules/env-check.ts
Step 2: OpenClaw Auto-Installation
UI: 进度条 + 分步状态列表，无需用户操作流程:
解压内置 Node.js 运行时 → ~/.openclaw/node/
解压 OpenClaw 核心包 → ~/.openclaw/openclaw-runtime/
创建目录结构 (skills/, extensions/, logs/)
写入启动脚本 (openclaw.cmd)
添加到用户 PATH (via setx)
写入初始 openclaw.json
模块: src/main/modules/openclaw-installer.ts, src/main/modules/node-runtime.ts关键决策: OpenClaw + Node.js 全部内置在 EXE 中（extraResources），支持完全离线安装。构建时使用 BFS 扁平化依赖（复用 ClawX 的 bundle-openclaw.mjs 方案）
Step 3: AI Provider Configuration (智谱 AI / SiliconFlow)
UI: 卡片式并列展示两个 Provider，用户点选其一（或两个都配）
plaintext
┌─────────────────────────────────────────────────┐
│  🔑 选择 AI 模型提供商                            │
│                                                   │
│  ┌──────────────────┐  ┌──────────────────┐       │
│  │  🧠 智谱 AI       │  │  🌊 SiliconFlow  │       │
│  │                  │  │                  │       │
│  │  GLM-4.7-Flash   │  │  DeepSeek-V3     │       │
│  │  永久免费·不限量  │  │  多模型·有免费额度 │       │
│  │                  │  │                  │       │
│  │  [选择 ✓]        │  │  [选择]          │       │
│  └──────────────────┘  └──────────────────┘       │
│                                                   │
│  ── 获取 API Key ──────────────────────────────   │
│                                                   │
│  1. 点击下方按钮，打开智谱开放平台                    │
│     [打开注册页面 →]                               │
│  2. 注册/登录 → 进入控制台 → API Key 管理           │
│  3. 创建新 Key → 复制                             │
│                                                   │
│  API Key: [已从剪贴板自动填入: sk-***********]     │
│           ✅ 验证成功！模型 GLM-4.7-Flash 已连接    │
│                                                   │
│  [← 上一步]                      [下一步 →]       │
└─────────────────────────────────────────────────┘
支持的 Provider:
Provider	Provider ID	Base URL	默认模型	环境变量	免费政策
智谱 AI	zai	https://open.bigmodel.cn/api/paas/v4	glm-4.7-flash	ZAI_API_KEY	永久免费不限量
SiliconFlow	siliconflow	https://api.siliconflow.cn/v1	deepseek-ai/DeepSeek-V3	SILICONFLOW_API_KEY	注册赠送额度
两者都使用 openai-completions 协议（OpenAI 兼容格式），OpenClaw 原生支持。API Key 获取体验优化（两个 Provider 通用）:
一键直达 Key 页面：不是跳转首页，而是直接跳转到 API Key 管理页
智谱: https://open.bigmodel.cn/usercenter/apikeys
SiliconFlow: https://cloud.siliconflow.cn/account/ak
内嵌图文指引：安装器内展示 2-3 张截图，标注"点这里创建 Key"
剪贴板自动检测：用户在网页上复制 Key 后，安装器自动检测剪贴板中的 sk- 前缀字符串并填入
粘贴即验证：Key 填入后自动触发验证，不需要额外点按钮
可配多个：用户可以同时配置智谱和 SiliconFlow，选一个作为默认
验证逻辑:
智谱: GET https://open.bigmodel.cn/api/paas/v4/models with Bearer token
SiliconFlow: GET https://api.siliconflow.cn/v1/models with Bearer token
验证成功 → 写入 openclaw.json provider 配置 + auth-profiles.json
模块: src/main/modules/provider-setup.ts（统一处理两个 Provider，不再单独 siliconflow.ts）
Step 4: WeCom Channel Setup (Optional, Skippable)
UI: 表单填写 Bot ID + Secret，附图文操作指引用户需做:
在企微管理后台创建自建应用 → 获取 Bot ID
获取应用 Secret
粘贴到安装器
安装器自动做:
验证 Bot 凭证
安装 WeCom 插件到 ~/.openclaw/extensions/wecom/
写入 openclaw.json 的 channels + plugins 配置:
json
{
  "channels": {
    "wecom": {
      "enabled": true,
      "accounts": {
        "default": {
          "enabled": true,
          "botId": "<user_input>",
          "secret": "<user_input>",
          "dmPolicy": "open",
          "allowFrom": ["*"]
        }
      },
      "defaultAccount": "default"
    }
  },
  "plugins": {
    "allow": ["wecom"],
    "enabled": true,
    "entries": { "wecom": { "enabled": true } }
  }
}
模块: src/main/modules/wecom-setup.ts
Step 5: Skills Auto-Installation
UI: Skill 清单（带 checkbox），全部预选，展示安装进度默认安装的 Skills:
pdf, xlsx, docx, pptx（文档处理）
code-assist, file-tools, terminal（开发工具）
find-skills（技能搜索）
如有 Config Clone 导入，按模板安装
模块: src/main/modules/skills-installer.ts策略: Skills 预打包在 extraResources/preinstalled-skills/，直接复制到 ~/.openclaw/skills/，不需要网络下载
Step 6: Verification & Launch
UI: 安装摘要 + 验证清单 + 启动按钮验证:
启动 OpenClaw Gateway 进程
健康检查（ping gateway endpoint）
如果配置了 WeCom，测试连接
注册开机自启动
启动系统托盘应用
模块: src/main/modules/service-manager.ts
Config Clone Feature
导出（从已配置好的机器）:
读取 ~/.openclaw/openclaw.json + skills 列表
脱敏：替换 API Key / Secret 为占位符 (__SILICONFLOW_API_KEY__)
保存为 openclaw-config-template.json
导入（安装向导 Step 1）:
加载模板文件，预填所有非敏感配置
跳转到 Step 3 只需填写 API Key 和 WeCom 凭证
Skills 按模板自动选择
模块: src/main/modules/config-clone.ts
Tray App (Post-Install)
安装完成后常驻系统托盘，管理 OpenClaw 生命周期。功能:
启动/停止/重启 Gateway
状态图标（绿=运行 / 黄=启动中 / 红=异常）
右键菜单：状态、重启、查看日志、打开配置目录、重新运行安装向导、退出
自启动:
Windows: 写入注册表 HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
macOS: ~/Library/LaunchAgents/ plist
进程管理:
通过 standalone Node.js 启动 Gateway（不用 Electron 的 Node）
崩溃自动重启（最多 3 次，指数退避）
日志写入 ~/.openclaw/logs/gateway.log
模块: src/tray/index.ts, src/tray/gateway-manager.ts, src/tray/tray-menu.ts
Project Structure
plaintext
lobster-community/apps/openclaw-installer/
├── package.json
├── electron-builder.yml
├── tsconfig.json
├── vite.config.ts
├── scripts/
│   ├── bundle-openclaw.mjs        # 扁平化 OpenClaw 依赖（from ClawX）
│   ├── bundle-node.mjs            # 打包 standalone Node.js
│   └── bundle-skills.mjs          # 打包预装 Skills
├── resources/
│   ├── icon.ico / icon.icns
│   ├── tray-icons/                # 托盘图标（green/yellow/red）
│   └── default-skills.json        # 默认 Skill 清单
├── src/
│   ├── main/                      # Electron 主进程
│   │   ├── index.ts               # 入口
│   │   ├── ipc-handlers.ts        # IPC 通道注册
│   │   ├── preload.ts             # Context Bridge
│   │   └── modules/
│   │       ├── env-check.ts       # 环境检测
│   │       ├── openclaw-installer.ts  # OpenClaw 安装逻辑
│   │       ├── node-runtime.ts    # Node.js 运行时管理
│   │       ├── config-writer.ts   # 配置文件生成/合并
│   │       ├── provider-setup.ts  # Provider 验证（智谱 + SiliconFlow）
│   │       ├── wecom-setup.ts     # WeCom 配置
│   │       ├── skills-installer.ts    # Skills 安装
│   │       ├── config-clone.ts    # 配置导入/导出
│   │       └── service-manager.ts # Gateway 启动 + 自启动注册
│   ├── renderer/                  # 向导 UI
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx                # 向导容器 + 步骤路由
│   │   ├── components/
│   │   │   ├── WizardShell.tsx    # 步骤指示器 + 导航
│   │   │   ├── StepWelcome.tsx
│   │   │   ├── StepInstall.tsx
│   │   │   ├── StepProvider.tsx   # Provider 选择（智谱/SiliconFlow）
│   │   │   ├── StepWeCom.tsx
│   │   │   ├── StepSkills.tsx
│   │   │   ├── StepComplete.tsx
│   │   │   └── ConfigImport.tsx   # 配置导入弹窗
│   │   ├── hooks/
│   │   │   ├── useWizardState.ts
│   │   │   └── useIpc.ts
│   │   ├── i18n/
│   │   │   ├── zh-CN.json
│   │   │   └── en.json
│   │   └── styles/
│   │       └── globals.css
│   └── tray/                      # 托盘应用（独立入口）
│       ├── index.ts
│       ├── gateway-manager.ts
│       └── tray-menu.ts
└── test/
    ├── env-check.test.ts
    ├── config-writer.test.ts
    └── provider-setup.test.ts
IPC Channels
Channel	Direction	Purpose
env:check	renderer → main	触发环境扫描
env:result	main → renderer	返回检查结果
install:start	renderer → main	开始安装 OpenClaw
install:progress	main → renderer	进度更新 (0-100 + message)
siliconflow:validate	renderer → main	验证 SiliconFlow API Key
zhipu:validate	renderer → main	验证智谱 AI API Key
provider:clipboard	main → renderer	剪贴板检测到 API Key
wecom:test	renderer → main	测试 WeCom 连接
config:write	renderer → main	写入最终配置
skills:install	renderer → main	开始安装 Skills
skills:progress	main → renderer	逐项安装进度
service:start	renderer → main	启动 Gateway + Tray
config:import	renderer → main	打开文件对话框，解析模板
Build & Packaging
构建流程
bash
# 1. 打包依赖
pnpm run bundle:openclaw    # BFS 扁平化 OpenClaw deps
pnpm run bundle:node        # 下载 standalone Node.js
pnpm run bundle:skills      # 复制预装 Skills

# 2. 编译
pnpm run build              # Vite 编译 renderer + main

# 3. 打包 EXE
pnpm run package:win        # electron-builder → NSIS EXE
pnpm run package:mac        # electron-builder → DMG (secondary)
electron-builder.yml 关键配置
yaml
productName: "OpenClaw 安装向导"
appId: "com.lobster.openclaw-installer"
asar: true

extraResources:
  - from: "build/openclaw-bundle/"
    to: "openclaw-bundle/"
  - from: "build/node-runtime/"
    to: "node-runtime/"
  - from: "build/preinstalled-skills/"
    to: "preinstalled-skills/"
  - from: "resources/"
    to: "resources/"

win:
  target: nsis
  icon: "resources/icon.ico"

nsis:
  oneClick: true
  perMachine: false
  allowElevation: false

mac:
  target: dmg
  icon: "resources/icon.icns"
预估包体积
Component	Size
Electron runtime	~65 MB
Node.js standalone	~20 MB
OpenClaw bundle	~30 MB
Pre-bundled skills	~5 MB
UI assets	~2 MB
Total EXE	~120 MB
Error Handling
Scenario	Handling
无网络	使用内置 OpenClaw + Node.js，跳过版本检查，SiliconFlow 验证警告
杀毒软件拦截	检测失败后提示加白名单
已有 OpenClaw	提供升级/覆盖/跳过选择
API Key 无效	显示具体错误，允许重试
WeCom 连接失败	允许跳过，标记"待配置"
Skills 部分安装失败	继续剩余项，汇总显示失败项
端口冲突	检测 Gateway 端口占用，提供备选端口
企业代理/防火墙	Step 1 提供代理设置入口
Implementation Phases
Phase 1: 项目脚手架 + 核心安装
在 monorepo 中初始化 Electron 项目
适配 ClawX 的 bundle-openclaw.mjs 构建脚本
实现 env-check.ts + openclaw-installer.ts + node-runtime.ts
构建 WizardShell + StepWelcome + StepInstall UI
IPC 通道搭建
Phase 2: 配置步骤
实现 provider-setup.ts（智谱 + SiliconFlow 验证 + 剪贴板检测）+ StepProvider
实现 wecom-setup.ts + StepWeCom
实现 config-writer.ts（生成 openclaw.json）
实现 skills-installer.ts + StepSkills
Phase 3: 服务管理 + 托盘
实现 service-manager.ts
构建 Tray App (gateway-manager + tray-menu)
Windows 自启动注册
StepComplete 验证逻辑
Phase 4: 增强功能 + 打包
Config Clone 导入/导出
i18n 完善（zh-CN 为主）
错误处理 + 边界情况覆盖
Windows EXE 签名 + 打包测试
Verification
开发阶段测试
bash
pnpm dev                    # 启动开发模式，热更新
pnpm test                   # 运行单元测试
pnpm typecheck              # TypeScript 类型检查
pnpm lint                   # ESLint 检查
打包验证
pnpm run package:win 生成 EXE
在 Windows 虚拟机中测试完整安装流程
验证 ~/.openclaw/ 目录结构正确生成
验证 openclaw.json 配置格式正确
验证 Gateway 能正常启动和响应
验证托盘图标正常显示和操作
验证开机自启动生效
验证 SiliconFlow API 调用正常
如配置了 WeCom，验证消息收发正常
关键文件参考（ClawX 源码）
/tmp/ClawX/scripts/bundle-openclaw.mjs — 依赖打包方案，直接复用
/tmp/ClawX/electron/shared/providers/registry.ts — SiliconFlow provider 定义
/tmp/ClawX/electron/utils/channel-config.ts — WeCom 配置格式
/tmp/ClawX/electron/gateway/process-launcher.ts — Gateway 启动方式
/tmp/ClawX/electron/gateway/config-sync.ts — 配置同步逻辑
/tmp/ClawX/src/pages/Setup/index.tsx — Setup Wizard 参考实现
/tmp/ClawX/electron-builder.yml — 打包配置参考
/tmp/ClawX/src/i18n/locales/zh/channels.json — WeCom 中文文案
Notes
此文档也将复制到 lobster-community/apps/openclaw-installer/SPEC.md 作为项目记录
Windows EXE 为首要目标平台，macOS DMG 为次要
安装器本身是"安装完就退"的工具，不包含聊天 UI；后续日常使用通过企微 / CLI / 托盘管理
未来可扩展：对接 AI HUB 网站，从网页直接触发安装/配置更新