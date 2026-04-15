# Lobster AI 同事克隆系统施工档案

- 日期：2026-04-13
- 记录类型：施工档案 / 阶段实现记录
- 适用范围：
  - `apps/openclaw-installer`
  - `apps/web`
  - `packages/shared`

## 1. 本轮施工目标

本轮的目标不是继续扩展旧的 OpenClaw 社区叙事，而是先把 Lobster 的第二层能力做成一个真实可跑的闭环：

1. 用安装码表示一个 AI 同事
2. 让 installer 能解析安装码
3. 让模板包能在本地落地为一个独立的 agent home
4. 在 OpenClaw 下生成第一版可见的落地结果

一句话概括：

“从模板展示，推进到 AI 同事可克隆。”

## 2. 这轮采用的核心设计

本轮明确采用以下判断：

1. 对外主交互优先采用“安装码 / 安装链接”
2. 对内协议采用结构化模板包
3. 不把直接修改 `AGENTS.md` 作为唯一真相来源
4. 先生成 Lobster 自己的 agent home，再由 Runtime adapter 输出到目标环境

因此，当前结构是：

### 2.1 用户侧

- Web 展示 AI 同事模板
- 用户复制安装码，例如：`lobster://install/meeting-ops-v1`
- 在 installer 中导入安装码

### 2.2 系统侧

- 安装码解析为模板包
- 模板包写入本地 `~/.lobster/agents/<agent-key>/`
- 若目标 Runtime 为 OpenClaw，再生成一段 Lobster 托管的 `AGENTS.md` 区块

## 3. 本轮新增的关键结构

### 3.1 共享模板 registry

新增 `packages/shared/src/lobster-registry.ts`

用途：

1. 定义安装码协议
2. 定义模板包类型
3. 提供共享模板列表
4. 提供安装码解析函数

这一步的意义是把“AI 同事模板”从单端 mock 提升为 monorepo 共享数据源，避免 Web 和 installer 各维护一份不同数据。

### 3.2 Installer 内的 AI 同事导入模块

新增 `apps/openclaw-installer/src/main/modules/agent-import.ts`

当前职责：

1. 根据安装码解析模板包
2. 生成 `agentKey`
3. 创建本地 `agent home`
4. 写入：
   - `agent.json`
   - `persona.md`
   - `template-lock.json`
   - `runtime.json`
   - `shortcuts.json`
5. 更新 `~/.lobster/active-agent.json`
6. 若目标 Runtime 为 OpenClaw，则写入 `~/.openclaw/AGENTS.md`

### 3.3 Installer 导入交互

`apps/openclaw-installer/src/renderer/App.tsx`

当前新增能力：

1. 在第一步提供安装码输入框
2. 输入 `lobster://install/...` 后可解析模板
3. 解析成功后，自动把向导切换为模板推荐的：
   - 使用场景
   - Runtime
   - 部署方式
4. 在最后一步执行“导入当前 AI 同事到本地”
5. 展示导入结果，包括 agent home 和 OpenClaw 输出位置

### 3.4 Web 侧模板卡片

`apps/web/src/App.tsx`

当前已改为：

1. 使用共享 registry 数据
2. 模板卡片展示真实安装码
3. 点击按钮可复制安装码

这一步已经把 Web 从“假模板展示”推进到了“可用于 installer 导入”的状态。

## 4. 当前本地落地格式

本轮已经形成了 Lobster 自己的本地目录约定雏形：

```text
~/.lobster/
  active-agent.json
  agents/
    <agent-key>/
      agent.json
      persona.md
      template-lock.json
      runtime.json
      shortcuts.json
      history/
```

这意味着：

1. AI 同事不是一段散落文本
2. 每个 AI 同事都有独立的本地身份目录
3. 后续支持多 AI 同事切换时有自然扩展位

## 5. 当前 OpenClaw 适配方式

目前只实现了第一版最小 OpenClaw adapter 逻辑：

1. 仍然保留 `~/.lobster/agents/<agent-key>/` 作为主落地点
2. 同时向 `~/.openclaw/AGENTS.md` 写入 Lobster 托管区块
3. 写入时带 start / end marker，避免重复导入时无脑追加

这一步是一个过渡设计：

- 优点：现在就能看到导入结果
- 缺点：还不算完整的 Runtime adapter

后续仍需要把 OpenClaw 的输出规则从“AGENTS.md 区块”升级为更清晰的适配层。

## 6. 本轮验证结果

已完成验证：

1. `pnpm --filter lobster-installer typecheck`
2. `pnpm --filter lobster-installer build:vite`

本轮之后，installer 中“安装码 -> 模板包 -> agent home -> OpenClaw 输出”这一链路已经存在。

## 7. 当前仍然刻意没有做的内容

本轮没有进入以下范围：

1. 远程模板 registry 后端服务
2. `lobster://` 深链系统级注册
3. 自动监听剪贴板并弹出导入
4. 多 Runtime 全量 adapter
5. 真正的 Skills 安装与扩展安装闭环
6. Web 端模板详情页和下载页

这些内容不是不做，而是被刻意后置，以保证当前阶段先形成一个稳定的最小闭环。

## 8. 这轮的关键判断

### 判断 1

不以剪贴板 JSON 作为最终协议，只把它视为可选调试手段。

### 判断 2

安装码是对外主交互；模板包是内部主协议。

### 判断 3

AI 同事的本地真相应放在 `~/.lobster/agents/`，而不是只存在于某个 Runtime 的单一配置文件里。

### 判断 4

OpenClaw 当前只是首个适配目标，不是整个产品的唯一绑定对象。

## 9. 下一步建议

本轮完成后，建议按以下顺序继续施工：

1. 把模板详情页和复制安装码入口做完整
2. 为 installer 增加本地剪贴板检测，但仍以安装码为主
3. 抽出正式的 Runtime adapter 接口
4. 将 OpenClaw adapter 从 `AGENTS.md` 过渡为更规范的输出策略
5. 再接第二个 Runtime，验证 Lobster 不绑定单一生态

## 10. 当前结论

Lobster 的“AI 同事克隆系统”已经从产品概念进入了可运行雏形阶段。

当前最重要的成果不是页面，而是三件事情已经成立：

1. 有统一模板协议
2. 有本地 agent home
3. 有安装码导入闭环

这三件事成立后，后面的 Web 展示、渠道接入和多 Runtime 扩展才有了稳定基础。
