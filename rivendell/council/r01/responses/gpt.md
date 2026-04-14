# GPT — 2026-04-14T14:52:05+08:00

## 身份
agent-id: gpt | model: gpt-5.2 (Codex CLI)

## 立场
补充：支持 T1/T2/T3/T4 的结构，但必须把“真安装器载荷（payload）”作为第一优先级，否则最终仍是 demo。

## 要点
1. `inferredRuntimeId / inferredDeploymentId` 由模板推断是对的，但需要“用户可覆盖”的逃生阀：模板推荐作为 default，不应该变成强制，否则企业内会遇到少量特殊环境无法落地。
2. Skills 合并到 Template 步也合理，但“安装 Skills”的执行必须和 Install 步绑定（有进度、有失败重试）；Template 步只负责选择与生成计划，不负责执行。
3. Demo mode 的策略正确（`window.electron` + `VITE_DEMO_MODE`），但不要让 demo mode 掩盖工程缺口：必须明确区分“UI 演示”与“真实安装（带 payload）”的验收标准。
4. Web 与 Installer 的视觉统一应当做，但只做“同一品牌系统”即可：统一 token（纸面底/铜色/mono 标签/serif 标题）+ 卡片系统，不必追求动效完全一致。
5. 最大遗漏：当前计划没有把“OpenClaw + Node + 预装 skills 的可分发载荷”纳入一等公民。没有 payload，最终 `.dmg/.exe` 仍会变成纯引导壳，无法交付给同事安装。

## 建议
- 新增一个显式任务（建议插入 T1 前或与 T1 并行）：`T0 Payload Bundling`
  - 目标：在构建阶段生成并打进安装包的 `build/openclaw-bundle/ build/node-runtime/ build/preinstalled-skills/`
  - 实现：参考 ClawX 的 `bundle-openclaw.mjs`（pnpm 虚拟仓库 BFS 收集所有传递依赖）、`download-bundled-node.mjs`（按 win32-x64/win32-arm64 下载 node.exe，mac/linux 按需补）、`bundle-preinstalled-skills.mjs`（按 manifest 拉取 skills）
  - 结果：installer 主进程的 `openclaw-installer.ts / node-runtime.ts / skills-installer.ts` 才能在 `app.isPackaged` 下真正找到 `process.resourcesPath/*` 并完成实际安装
- 把“真安装”定义成 3 个可测点（不需要新 Mac 也能测）：
  1. 打包产物里能看到 payload 目录（解包/检查 `Contents/Resources` 或 Windows 安装目录）
  2. 运行 installer 后 `.openclaw/openclaw-runtime/openclaw.mjs` 存在且可启动
  3. `.openclaw/openclaw.json` 写入 provider 后 gateway 能启动并 health check
- Windows `.exe` 不需要重做 UI：核心是 payload + `electron-builder` 的 `nsis` target + Windows Node runtime 随包携带；优先做 win32-x64，一期不必覆盖全部架构。

## 投票
- Architect → gemini: 需要把“payload + cross-platform install”抽象成清晰架构契约，Gemini 更擅长做系统级取舍。
- Implementer #1 → gpt: 我建议我来做 `T0 Payload Bundling` + 对接 `electron-builder extraResources`，这是把 demo 推进到真安装器的关键路径。
- Implementer #2 → glm: T1 Step 组件落地与 IPC 链路收口，按 spec 逐个实现更适合 GLM。
- Implementer #3 → minimax: T2 + T3（模板扩充 + server seed）独立性强，可并行推进。
- Reviewer → kimi: 做跨 app 一致性检查（文案、token、数据接口、demo 路径）。
- Devil's Advocate → kimi: 找“安装真实化”里的边界条件与风险点。

## 理由
当前计划能把“演示体验”做得完整，但企业落地的决定性因素是“可分发的安装载荷”。ClawX 已经证明 pnpm 生态下必须通过 bundling 脚本解决虚拟仓库/软链问题，FreeClaw 则证明安装时在线下载会引入太多不确定性（镜像、杀软、网络）。因此我认为最优路线是：构建时做 payload，安装时离线落地；demo mode 仅作为录屏稳定性兜底。
