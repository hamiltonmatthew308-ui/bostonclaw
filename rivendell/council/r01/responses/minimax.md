# MiniMax — 2026-04-14T15:30+08:00

## 身份
agent-id: minimax | model: MiniMax-M2.7

## 立场
支持施工计划主线，补充两个被忽略的实现细节，并对 T0 的优先级提出异议。

## 要点

1. **T0 Payload Bundling 是对的，但不应阻塞当前 council 的执行计划。** GPT 和 Kimi 都把 T0 列为最高优先级，但 CODEX-PROMPT.md 的定位明确是"演示录屏"——demo.sh、Demo mode、录屏指南三件套说明当前目标是 pitch 视频，不是交付 1500 人使用的生产安装包。T0 应列入 decisions.md 作为 Phase 2 任务，不应插队卡住当前执行链。让 demo 先跑起来，T0 并行规划。

2. **Server seed 的时间戳设计有个隐患。** `seedDemoData()` 在模块加载时执行，feed 事件的 `Date.now() - Math.random() * 24h` 会正确分布在过去 24 小时——但如果 server 重启，所有事件重新生成，时间线会"重置"。对 demo 录屏无所谓，但如果 web 页面在同一次录屏中刷新两次，社区雷达的数据会跳变。建议用固定偏移量（`FIXED_SEED_EVENTS`，硬编码 25 个相对时间偏移），而不是 `Math.random()`——这样重启后事件模式一致，只有绝对时间戳在变。

3. **`registry:resolveInstallCode` IPC 的失败路径未被处理。** CODEX-PROMPT.md 描述了安装码输入和导入，但没有说如果 `lobster://install/unknown-template` 无法解析时怎么处理。Flow A 当前有这个逻辑，不能在重写时丢失。GLM 提议的 `invokeIPC` 统一出口正好可以内置错误 boundary，建议 T1-store 一并实现。

## 建议

- T0 写入 `decisions.md` 作为 D001（Phase 2 待规划），不进入当前执行链
- `seedDemoData()` 改用固定偏移量数组，保证 demo 数据跨重启一致
- `invokeIPC<T>` 的 mock 分支需要覆盖 `registry:resolveInstallCode` 的失败态（返回 `null`，Step 显示"安装码无效"提示）
- T4 范围严格限制为：accent `#D4401A`、卡片边框、Google Fonts、加"下载安装桥"按钮。其余不动。

## 投票

- Architect → gemini: 状态机和组件边界需要全局视角，Gemini 2.5 Pro 适合
- Implementer #1 → gpt: T1-ui（主体 Step 重写），批量组件生成 GPT 最稳
- Implementer #2 → glm: T1-store（Zustand + invokeIPC + mock 层），数据层按 spec 实现 GLM 擅长
- Implementer #3 → minimax: T2（模板扩充）+ T3（server seed）+ T6（scripts）+ T4（最小视觉修改），独立任务我认领
- Reviewer → kimi: 跨文件类型同步和一致性审查，Kimi 长上下文能力适合
- Devil's Advocate → kimi: 兼任，找企业落地边缘风险

## 理由

- GPT 对 T0 的判断在工程上是正确的，但在当前时间窗口（演示录屏）下是过度工程的方向。Phase 2 再做。
- 我认领的四个任务（T2/T3/T6/T4）彼此独立、spec 明确，没有 UI 视觉判断需求，适合并行输出。
- GLM 的 `invokeIPC` 统一出口是本次 council 最有价值的架构建议，应写入 resolution 作为约束。
