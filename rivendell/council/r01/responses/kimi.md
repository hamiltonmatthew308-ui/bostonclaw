# Kimi — 2026-04-14T15:05+08:00

## 身份
agent-id: kimi | model: kimi-k2

## 立场
支持施工计划主线，整合各 agent 意见，提出任务拆分和风险控制的综合建议。

## 要点

1. **T1 拆分采纳 GLM 的"按层拆"方案**。Claude 的"按步骤拆"会导致 store.ts 和 App.tsx 的并发修改冲突，GLM 提出的 T1-store（数据层）→ T1-ui（渲染层）顺序执行更合理，文件边界清晰无重叠。

2. **必须加入 GPT 提出的 T0 Payload Bundling**。当前计划只做 UI 重写会导致 installer 仍是"空壳"——演示时看起来能装，实际交付给员工时无法离线安装。T0 应作为最前置任务，产出 `build/openclaw-bundle/` 等目录，T1 的 Install 步才能对接真实载荷。

3. **Skills 步骤处理：选择并入 Template，安装留在 Install**。同意 Gemini 的"职能 = 模板 + 技能组"模型，但执行安装（带进度条、失败重试）必须在 Install 步完成。Template 步只生成安装计划（selectedSkills 列表），不执行实际安装。

4. **Demo mode 需要显式的"真/假"验收标准**。GPT 提出的三个可测点（payload 目录存在、openclaw.mjs 可启动、gateway health check）应作为 installer 的 exit criteria，demo mode 仅用于录屏稳定性兜底，不能掩盖工程缺口。

5. **T4 范围应严格限制**。GLM 说得对，496 行 TS + 898 行 CSS 对这个规模不算大，拆分是过度工程。只做：accent 颜色统一为 `#D4401A`、卡片边框风格统一、Google Fonts 引入，不动组件结构。

## 建议

- **任务依赖链调整为**：T0（Payload）→ T1-store（Zustand + mock IPC）→ T1-ui（Step 重写）→ T3（Server seed）→ T4（Web 最小视觉对齐）→ T5/T6
- **T1-store 增加 `invokeIPC` 统一出口**：GLM 提出的封装方式正确，demo/real 模式切换在 store 层处理，避免每个 Step 组件单独判断 `isDemoMode`
- **Install code 输入位置**：采纳 GLM 建议，从 StepWelcome 移到 StepScenario，Welcome 只做 env check，Scenario 做"场景选择 OR 安装码导入"的二选一交互
- **模板 systemPrompt 质量**：T2 的 6 个模板每个 persona.systemPrompt 至少 5-8 句，2-3 句太短会导致 AI 同事回复质量差

## 投票

| 角色 | 投票给 | 理由 |
|------|--------|------|
| Architect | gemini | 需全局把控 store 设计、组件契约、多环境兼容，Gemini 架构视野最适合 |
| Implementer #1 | gpt | T0 Payload Bundling + T1-ui（主体 UI 重写），Codex CLI 的大批量代码生成能力匹配 |
| Implementer #2 | glm | T1-store（数据层 + mock IPC）+ T2（模板扩充），数据驱动工作 GLM 稳定，且 T1-store 是 T1-ui 前置依赖 |
| Implementer #3 | minimax | T3（server seed）+ T6（scripts）+ T4（Web 最小修改），独立性强可并行 |
| Reviewer | kimi | 我担任，负责跨 app 类型同步、文案一致性、验收标准检查 |
| Devil's Advocate | kimi | 我兼任，重点找"企业内网离线安装""Windows 杀软拦截""payload 体积过大"等边缘风险 |

## 理由

- **整合优于创新**：Claude/GPT/Gemini/GLM 的意见各有侧重，Orchestrator 的核心价值是整合而非另提方案。GLM 的"按层拆"解决了 Claude"按步骤拆"的冲突风险，GPT 的 T0 补上了计划最大缺口，这些都是必须采纳的修正。

- **Kimi 担任 Reviewer + Devil's Advocate 的优势**：我的长上下文能力适合在 T1-ui 完成后做全量文件审查（store types → Step 组件 → IPC 调用 → 样式一致性），同时从"1500 人企业实际落地"角度质疑——比如"IT 部门是否会允许员工电脑运行未签名的 exe""payload 超过 500MB 怎么办"等 Codex Prompt 未覆盖的问题。

- **风险优先级**：真实安装载荷（T0）> 状态层正确性（T1-store）> UI 完成度（T1-ui）> 其他。Demo 可以靠 mock 数据跑通，但交付给同事时必须能离线安装，T0 是这个项目的生死线。
