# 2026-04-14 Demo Script And Root Scripts

## 目标

对应 `CODEX-PROMPT.md` 中的：

- T5：补 `demo.sh` 和录屏指南
- T6：补根 `package.json` scripts，给开发和演示提供统一入口

## 本轮改动

### 1. 新增 Demo 启动脚本

新增：

- `scripts/demo.sh`

功能：

- 从仓库根目录启动 `server`
- 启动 `web`
- 以 `VITE_DEMO_MODE=true` 启动 `lobster-installer`
- 输出当前 demo 的三个入口地址
- 在退出时清理后台任务

说明：

- 使用的是 workspace 里真实的 package 名：
  - `server`
  - `web`
  - `lobster-installer`
- 脚本不依赖 macOS 专属命令

### 2. 新增录屏文档

新增：

- `docs/demo-recording-guide.md`

内容包括：

- 启动前检查
- 建议的 3-5 分钟录屏节奏
- Hero / 模板中心 / Installer / 社区雷达 的演示顺序
- Demo Mode 与 server seed 的注意事项

### 3. 补根 scripts

修改：

- `package.json`

新增脚本：

- `dev:installer`
- `demo`

当前根脚本为：

- `dev`
- `dev:web`
- `dev:server`
- `dev:installer`
- `build`
- `typecheck`
- `demo`

## 验证

已验证：

- `bash -n scripts/demo.sh`
- `chmod +x scripts/demo.sh`
- 根 `package.json` 已包含：
  - `dev:installer`
  - `demo`

补充说明：

- 我执行 `pnpm run demo --help` 时，脚本本身已经开始正常启动
- 但当前机器上当时存在 `3888` 端口冲突，server 返回 `EADDRINUSE`
- 这说明脚本入口已接通，失败原因是本机已有占用，不是脚本语法问题

## 当前状态

现在仓库已经具备：

- 一键启动 demo 的脚本
- 对应的录屏指南
- 根级别统一开发入口

下一步如果继续推进，优先级应该是：

1. 实际跑一轮 `./scripts/demo.sh`
2. 校验 web + installer 的联动录屏路径
3. 如有必要，再补根级别的 `build:*` 或 `package:*` 快捷脚本
