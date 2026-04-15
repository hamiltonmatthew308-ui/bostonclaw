# OpenClaw Installer - 开发日志

> 项目目标：为约 1500 名不熟悉 CLI 的员工提供可视化的 OpenClaw 一键安装工具

---

## 📅 2026-03-31 - Phase 1 完成：项目脚手架 + 核心安装模块

### 今日完成

#### 1. 项目初始化
- ✅ 在 `lobster-community/apps/openclaw-installer/` 创建 Electron + React 项目
- ✅ 配置 Vite + vite-plugin-electron 构建系统
- ✅ 配置 Tailwind CSS + shadcn/ui 样式系统
- ✅ 配置 electron-builder (NSIS for Windows, DMG for macOS)
- ✅ 修复 `os.homedir()` 导入问题 (从 `path` 改为 `os` 模块)

#### 2. 核心架构模块

**主进程 (`src/main/`)**
```
index.ts          - 主进程入口，窗口管理
preload.ts        - Context Bridge，安全暴露 API
ipc-handlers.ts   - IPC 处理器注册
```

**功能模块 (`src/main/modules/`)**
| 模块 | 功能 | 状态 |
|------|------|------|
| `env-check.ts` | 系统环境扫描：OS版本、磁盘空间、Node.js、已有安装检测 | ✅ |
| `node-runtime.ts` | 内置 Node.js 运行时解压和管理 | ✅ |
| `openclaw-installer.ts` | OpenClaw 核心包安装、目录创建、配置写入 | ✅ |
| `provider-setup.ts` | 智谱 AI / SiliconFlow API Key 验证和配置 | ✅ |
| `wecom-setup.ts` | 企业微信 Bot 配置（待完善 IPC） | 🔄 |
| `skills-installer.ts` | 预装 Skills 的安装管理 | ✅ |
| `config-writer.ts` | openclaw.json 配置生成和合并 | ✅ |
| `config-clone.ts` | 配置导入/导出（Config Clone 功能） | ✅ |
| `service-manager.ts` | Gateway 服务启动和健康检查 | ✅ |

#### 3. 渲染进程 UI

**6步安装向导** (`src/renderer/components/`)

| 步骤 | 组件 | 功能 | 状态 |
|------|------|------|------|
| Step 1 | `StepWelcome.tsx` | 环境检查结果显示、配置导入入口 | ✅ |
| Step 2 | `StepInstall.tsx` | 实时安装进度、分步状态显示 | ✅ |
| Step 3 | `StepProvider.tsx` | 智谱/SiliconFlow 选择、API Key 验证、剪贴板自动检测 | ✅ |
| Step 4 | `StepWeCom.tsx` | 企业微信 Bot ID/Secret 配置（可跳过） | ✅ |
| Step 5 | `StepSkills.tsx` | Skills 多选安装（文档/开发/系统工具） | ✅ |
| Step 6 | `StepComplete.tsx` | 安装摘要、Gateway 启动验证、完成 | ✅ |

**通用组件**
- `WizardShell.tsx` - 步骤指示器 + 导航容器

#### 4. 系统托盘应用
- `src/tray/index.ts` - 托盘入口
- `src/tray/gateway-manager.ts` - Gateway 进程管理（启动/停止/重启/健康检查）

#### 5. IPC 通信协议

**Invoke Channels (Renderer → Main)**
```typescript
'env:check'              // 环境检查
'install:start'          // 开始安装
'install:status'         // 获取安装状态
'provider:validate'      // 验证 Provider API Key
'provider:save'          // 保存 Provider 配置
'skills:install'         // 安装 Skills
'config:write'           // 写入配置
'config:import'          // 导入配置模板
'config:export'          // 导出配置模板
'service:start'          // 启动 Gateway
```

**Event Channels (Main → Renderer)**
```typescript
'install:progress'       // 安装进度更新
'install:complete'       // 安装完成
'skills:progress'        // Skills 安装进度
'clipboard:detected'     // 剪贴板检测到 API Key
'service:status'         // Gateway 状态更新
```

---

## 🔧 技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| Framework | Electron | 40.6.0 | 跨平台桌面应用 |
| UI | React | 19.2.4 | UI 框架 |
| Styling | Tailwind CSS | 3.4.19 | 原子化 CSS |
| Build | Vite | 7.3.1 | 快速构建 |
| Bundler | vite-plugin-electron | 0.29.0 | Electron 集成 |
| Packaging | electron-builder | 26.8.1 | NSIS / DMG 打包 |
| Language | TypeScript | 5.9.3 | 类型安全 |
| State | Zustand | 5.0.11 | 状态管理（预留） |

---

## 📁 项目结构

```
lobster-community/apps/openclaw-installer/
├── package.json                 # 项目配置
├── vite.config.ts              # Vite + Electron 配置
├── electron-builder.yml        # 打包配置
├── tailwind.config.js          # Tailwind 配置
├── tsconfig.json               # TypeScript 配置
├── SPEC.md                     # 实现规范文档
├── DEVLOG.md                   # 本开发日志
├── src/
│   ├── main/                   # Electron 主进程
│   │   ├── index.ts           # 入口
│   │   ├── preload.ts         # 预加载脚本
│   │   ├── ipc-handlers.ts    # IPC 处理器
│   │   └── modules/           # 功能模块
│   ├── renderer/              # React UI
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx            # 向导容器
│   │   ├── components/        # UI 组件
│   │   ├── styles/            # 全局样式
│   │   └── types/             # 类型定义
│   └── tray/                  # 托盘应用
│       ├── index.ts
│       └── gateway-manager.ts
├── scripts/                   # 构建脚本（待实现）
├── resources/                 # 静态资源（待添加）
└── test/                      # 测试文件
```

---

## ⚠️ 已知问题 & TODO

### 高优先级

1. **缺失的 IPC 处理器**
   - [ ] `wecom:test` - 测试企业微信连接
   - [ ] `wecom:save` - 保存企业微信配置

2. **构建脚本（需从 ClawX 复制并适配）**
   - [ ] `scripts/bundle-openclaw.mjs` - BFS 扁平化 OpenClaw 依赖
   - [ ] `scripts/bundle-node.mjs` - 下载 standalone Node.js
   - [ ] `scripts/bundle-skills.mjs` - 打包预装 Skills

3. **资源文件**
   - [ ] `resources/icon.ico` - Windows 图标
   - [ ] `resources/icon.icns` - macOS 图标
   - [ ] `resources/tray-icons/` - 托盘状态图标（绿/黄/红）

### 中优先级

4. **功能增强**
   - [ ] Windows 开机自启动注册（注册表）
   - [ ] macOS 开机自启动（LaunchAgents plist）
   - [ ] 剪贴板 API Key 自动检测优化（Web API 限制）
   - [ ] 配置导入后的步骤跳过逻辑

5. **错误处理**
   - [ ] 杀毒软件拦截检测
   - [ ] 端口冲突自动切换
   - [ ] 企业代理设置 UI

6. **测试**
   - [ ] 单元测试（Vitest）
   - [ ] E2E 测试（Playwright）
   - [ ] Windows 虚拟机测试

### 低优先级

7. **国际化**
   - [ ] 英文界面支持
   - [ ] 语言切换

8. **文档**
   - [ ] API 文档
   - [ ] 部署指南
   - [ ] 故障排查手册

---

## 🔗 关键文件引用

**ClawX 源码参考**
```
/tmp/ClawX/scripts/bundle-openclaw.mjs      - 依赖打包方案
/tmp/ClawX/electron/shared/providers/       - Provider 定义
/tmp/ClawX/electron/utils/channel-config.ts - WeCom 配置格式
/tmp/ClawX/electron/gateway/process-launcher.ts - Gateway 启动
/tmp/ClawX/src/pages/Setup/index.tsx        - Setup Wizard 参考
```

---

## 📊 预估包体积

| 组件 | 大小 |
|------|------|
| Electron runtime | ~65 MB |
| Node.js standalone | ~20 MB |
| OpenClaw bundle | ~30 MB |
| Pre-bundled skills | ~5 MB |
| UI assets | ~2 MB |
| **Total EXE** | **~120 MB** |

---

## 🎯 下一步行动

### 立即行动（今日/明日）
1. 复制 ClawX 的 `bundle-openclaw.mjs` 并适配
2. 添加图标资源到 `resources/`
3. 实现缺失的 `wecom:*` IPC 处理器

### 短期（本周）
4. 完整测试安装流程
5. Windows 打包测试
6. 修复发现的 bug

### 中期（下周）
7. 托盘应用完善
8. 开机自启动实现
9. 配置导入/导出功能测试

---

## 📝 开发笔记

### 2026-03-31 踩坑记录

**问题**: `path.homedir is not a function`
- **原因**: `homedir` 是 `os` 模块的函数，不是 `path` 模块的
- **解决**: 将所有 `import { homedir } from 'path'` 改为 `import { homedir } from 'os'`
- **影响文件**: 8 个模块文件 + 2 个 tray 文件

**Electron 构建脚本批准**
- 需要手动批准 `electron`, `electron-winstaller`, `esbuild` 的构建脚本
- 使用 `pnpm approve-builds` 或删除后重新安装

**开发服务器启动**
- 端口: 5174 (避免与其他项目冲突)
- 自动打开 DevTools (开发模式)
- 热更新已配置

---

## 👥 协作信息

- **项目位置**: `/Users/jouska/lobster-community/apps/openclaw-installer/`
- **Monorepo**: 使用 pnpm workspaces
- **目标平台**: Windows (主要), macOS (次要)
- **目标用户**: 1500 名不熟悉 CLI 的企业员工

---

*Last updated: 2026-03-31 by AI Assistant*
