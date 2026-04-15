# 2026-04-14 Web Editorial Refactor

## 目标

对应 `CODEX-PROMPT.md` 中的 T4：

- 把 Web 从单体 landing page 拆成更清晰的组件结构
- 视觉语言从旧的紫绿 citycraft 风格切回与 installer 一致的 `Copper Editorial`
- 让 Web 和 installer 看起来属于同一个产品，而不是两个独立 demo

## 主要改动

### 1. App.tsx 从单体页拆成主控壳

重写：

- `apps/web/src/App.tsx`

现在 `App.tsx` 只负责：

- 拉取 hub 数据 hook
- 初始化动效
- 组装页面 section

文件规模从原先的大型单体 JSX 收到 51 行。

### 2. 新增数据层与类型层

新增：

- `apps/web/src/types.ts`
- `apps/web/src/hooks/useHubData.ts`

作用：

- 将 `Agent / FeedItem` 类型抽离
- 将健康检查、Agent 列表、Feed、模板筛选、安装码复制逻辑抽成统一 hook

### 3. 页面拆成 4 个 section 组件

新增：

- `apps/web/src/components/SiteNav.tsx`
- `apps/web/src/components/HeroSection.tsx`
- `apps/web/src/components/GettingStartedSection.tsx`
- `apps/web/src/components/TemplateLibrarySection.tsx`
- `apps/web/src/components/CommunityRadarSection.tsx`

拆分后职责：

- `HeroSection`
  讲清楚产品定位和实时状态
- `GettingStartedSection`
  讲安装桥的 3 步路径
- `TemplateLibrarySection`
  展示 AI 同事模板、分类和安装码复制
- `CommunityRadarSection`
  消费 server seed 数据，展示在线 Agent、部门分布和动态 Feed

### 4. 视觉系统重置

重写：

- `apps/web/src/App.css`
- `apps/web/src/index.css`

方向：

- 从旧的紫绿 glow / citycraft 风格切回暖白纸面
- 与 installer 对齐为：
  - 暖白底
  - 深棕线框
  - 铜橙强调色
  - serif 标题 + mono 标签 + sans 正文

强调点：

- 固定顶部 pill nav
- Hero 改成 `editorial + concierge` 双栏结构
- 模板卡、雷达条和 dashboard 都统一到同一套卡片系统

## 结果

- Web 已不再是一个 495 行单体 `App.tsx`
- 页面结构和视觉语言与 installer 基本一致
- server 注入的 6 个 agents / 25 条 feed 能直接在 Web 页面里被消费

## 验证

已通过：

- `pnpm --filter web build`

## 后续建议

如果继续做 T4 的第二轮，可以优先处理：

1. 把 `App.css` 继续拆成按 section 分文件
2. 给模板卡补一个轻量详情层
3. 让 radar/dashboard 支持更明确的空态与 loading 态
