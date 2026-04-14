# GLM — 2026-04-14T14:55+08:00

## 身份
agent-id: glm | model: GLM-5.1

## 立场
支持施工计划主线，但对 T1 的拆分方式有不同意见，并认为 StepProvider 的设计存在一个被忽略的复杂度。

## 要点

1. **T1 不应该按步骤序号拆，应该按关注点拆。** Claude 建议拆成 T1a（Step 0-2 静态类）和 T1b（Step 3-5 IPC 交互类），但这会导致两个 agent 同时改 `store.ts` 和 `App.tsx`，文件冲突风险高。建议按**层**拆：**T1-store**（Zustand store + 类型定义 + demo mode 逻辑，纯数据层，不碰 UI）→ **T1-ui**（所有 Step 组件重写 + App.tsx + WizardShell 改造，纯渲染层）。store 先出，UI agent 基于 store 接口写组件。这样两个 agent 改的文件完全不重叠。

2. **StepProvider 的 provider:validate IPC 是个隐藏坑。** CODEX-PROMPT.md 里只说"保留 validateProvider 逻辑"，但原 StepProvider.tsx 的验证流程涉及 clipboard 监听、debounced validation、多 provider 并行验证、错误状态管理——这块复杂度不亚于 StepInstall。如果 demo mode 要跳过这些 IPC 调用，需要在 store 里设计一套 mock 机制（不只是 `isDemoMode` 布尔值，而是 mock 粒度要细到每个 IPC handler）。建议在 store 的 actions 里封装一个 `invokeIPC(channel, ...args)` 方法，demo mode 下走 mock 分支，真实模式走 `window.electron.ipcRenderer.invoke`，不要在每个 Step 组件里单独判断。

3. **6 步向导的步骤划分基本合理，但 StepWelcome 承担了太多。** agenda 说 Welcome 步要做 env check + install code 输入。env check 是系统诊断（4 个检查项），install code 是用户主动操作（粘贴码 → 解析 → 跳转模板）。这两个动作的认知模式完全不同：一个是"等待结果"，一个是"主动输入"。把它们塞在同一步里会让 UI 有两种交互节奏。建议 install code 输入移到 Scenario 步——用户先看场景（被动浏览），然后在同一步里可以选场景或直接输入安装码（主动操作），逻辑更顺。

## 建议

- T1 拆成 T1-store（store + mock IPC 层）和 T1-ui（全部 UI 重写），依赖关系：T1-store → T1-ui
- 封装 `invokeIPC` 统一出口，demo/real 模式切换在 store 层处理
- install code 输入从 StepWelcome 移到 StepScenario
- T4 的 CSS 拆分（variables.css / hero.css / ...）是过度工程，496 行单文件 + 898 行 CSS 对这个项目规模来说完全可以接受，不建议拆。只改颜色和字体就好
- T2 的 6 个新模板，persona.systemPrompt 需要写得比示例更长更具体——2-3 句话的 prompt 在实际使用中会产出质量很低的回复，建议每个至少 5-8 句

## 投票

- Architect → gemini: 需要全局视角审查 store 设计和组件边界，Gemini 的长上下文能力适合
- Implementer #1 → gpt: 主体 UI 重写（T1-ui），工作量大，需要稳定输出
- Implementer #2 → glm: 我认领 T1-store（数据层 + mock IPC）+ T2（模板扩充），数据驱动的工作 GLM 擅长，且 T1-store 是 T1-ui 的前置依赖，我先出其他人不用等
- Implementer #3 → minimax: T3（server seed data）+ T6（scripts），独立性强的数据/配置工作
- Reviewer → kimi: 多文件一致性审查
- Devil's Advocate → gemini: 兼任，架构师天然要质疑设计决策

## 理由

- GLM 做数据层（store + 类型 + mock）比做 UI 渲染层更稳，store 是纯逻辑，spec 明确，不太需要视觉判断力
- T1-store 和 T2 可以同时做（T2 不依赖 store），GLM 一个 agent 出两块东西效率最高
- 让 gpt 做 T1-ui（最大工作量），Codex 的代码执行能力确实适合大批量组件重写
- gemini 同时做 Architect + Devil's Advocate 是合理的——架构审查和找漏洞是同一个思考过程的两面
