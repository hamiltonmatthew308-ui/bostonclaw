# Changelog

## 2026-04-16 — claude — refactor
### What
安装器 bug 修复 + 代码简化（simplify review 产出）
### Why
review agents 发现 4 个实际 bug（typo 导致错误归因分支失效、Promise 悬挂导致界面卡 95%）+ 3 处冗余（重复环境检测、userData 误报、无意义类型别名）
### Files
- `apps/openclaw-installer/src/main/paths/hermes.ts` — fix epERM→eperm, etimmedout→timed out, WSL 规则合并，verifyHermes 加 .catch() 防 95% 卡住
- `apps/openclaw-installer/src/main/paths/freeclaw.ts` — run() 去掉重复 detectEnvironment()，detectExistingBostonclaw 移除 userData 误报和重复 Windows 路径
- `apps/openclaw-installer/src/main/utils/shell-stream.ts` — 移除无意义 StreamName 类型别名
- `apps/openclaw-installer/src/renderer/components/ProgressScreen.tsx` — 日志 buffer 加 200 条上限

---

## 2026-04-15 — kimi/claude — feat
### What
安装器重大重构：BostonClaw 品牌落地 + 真实安装流程
### Why
r03 resolution 执行，从"合并两套 UI"改为"智能分发路由器"设计；品牌从 Lobster 改为 BostonClaw
### Files
- `apps/openclaw-installer/src/renderer/components/WizardShell.tsx` — BOSTONCLAW 品牌，去掉"模板中心"，Install Concierge→一键极简安装
- `apps/openclaw-installer/src/renderer/components/QuizScreen.tsx` — 去掉大厂封装版路径，三选一卡片布局
- `apps/openclaw-installer/src/renderer/App.tsx` — BostonClaw Installer，FreeClaw/Hermes 跳过 API 步骤，back 逻辑修正
- `apps/openclaw-installer/src/renderer/components/PreflightScreen.tsx` — 只有 OpenClaw 进 provider 步骤
- `apps/openclaw-installer/src/main/paths/hermes.ts` — 改为真实运行 curl 脚本（Git Bash → WSL 降级），加 Windows 错误归因
- `apps/openclaw-installer/src/main/paths/freeclaw.ts` — Windows 内置 FreeClaw 启动器，非 Windows 打开下载页
- `apps/openclaw-installer/src/main/utils/shell-stream.ts` — 新增流式 shell 输出工具
- `apps/openclaw-installer/src/main/index.ts` — deep link `bostonclaw://install?path=...` 支持

---

## 2026-04-14 — kimi/minimax/glm — feat
### What
r03 施工：完整安装器 + 网站 + shared 数据层首次交付
### Why
r03 resolution 任务分配执行结果（单次大 commit be29e705，156 files, 27k lines）
### Files
- `apps/openclaw-installer/` — Electron 安装器，5 步向导，5 条安装路径，editorial 设计系统
- `apps/web/src/pages/` — Home / Templates / Report / Download 四页
- `packages/shared/src/vendor-registry.ts` — 7 家大厂注册表
- `packages/shared/src/lobster-registry.ts` — 44 个模板
- `apps/server/` — Hono 服务端，agent registry + SSE
- `apps/plugin/` — Claude Code 插件，auto-responder + agent client
- `.github/workflows/build-installer.yml` — CI 自动打包 .dmg + .exe
