# 最终联调 Checklist

## 我已经完成的 review

### 代码级 / 静态验证

- [x] `packages/shared` 模板数据已扩到 10 个
- [x] installer 已切到 6 步主流程
- [x] server 已注入 6 个 mock agents
- [x] server 已注入 25 条 feed
- [x] web 已拆组件并切到统一视觉系统
- [x] `scripts/demo.sh` 已创建并通过 `bash -n`
- [x] 根 `package.json` 已补 `dev:installer` 和 `demo`

### 构建 / 类型检查

- [x] `pnpm --filter lobster-installer typecheck`
- [x] `pnpm --filter lobster-installer build:vite`
- [x] `pnpm --filter server typecheck`
- [x] `pnpm --filter web build`

### 数据级验证

- [x] `store.ts` 直接验证：
  - agents = `6`
  - feed = `25`
  - skills = `5`

## 还没完成的“人工端到端 review”

下面这些必须手动走一遍，才算真正全链路 review 完成：

- [ ] `demo.sh` 在当前机器上完整启动成功
- [ ] Web 首页正常打开
- [ ] 模板中心能点击“复制安装码”
- [ ] Installer 能手动输入或粘贴安装码
- [ ] Installer 6 步能完整走通
- [ ] Installer 完成页能稳定显示成功状态
- [ ] IM 接入文档口径已明确（为什么本地版无法直连；推荐共享服务器 Relay；隧道仅实验选项）。见 `docs/im-integration.md`
- [ ] Community Radar 能展示 seeded agents / feed
- [ ] 整体录屏路径能顺畅切换 Web 和 Installer

## 推荐联调顺序

### 1. 清理端口占用

先检查：

```bash
lsof -i :3888
lsof -i :5173
lsof -i :5174
```

如果有旧进程，先停掉。

### 2. 启动 demo

```bash
cd /Users/jouska/Projects/lobster-community
./scripts/demo.sh
```

成功标准：

- Web: `http://127.0.0.1:5173`
- Server: `http://127.0.0.1:3888/health`
- Installer: Electron 窗口正常弹出

### 3. Web 侧检查

- [ ] Hero 正常显示
- [ ] 模板库能切分类
- [ ] 点击模板“复制安装码”后按钮状态会变化
- [ ] 社区雷达能看到在线 Agent、部门阵列、动态 Feed

### 4. Installer 侧检查

建议路线：

- Step 1：环境准备
- Step 2：使用场景，选“桌面个人使用”
- Step 3：模板中心，选“会议纪要员”
- Step 4：模型接入，填一条测试 key 或走 Demo Mode
- Step 5：安装执行，观察进度推进
- Step 6：完成交付，确认最终状态

成功标准：

- [ ] 没有空白页
- [ ] 没有卡死在某一步
- [ ] Demo Mode 下可以稳定自动推进

### 5. 录屏前最后确认

- [ ] 浏览器缩放正常
- [ ] Installer 窗口尺寸合适
- [ ] Web 和 Installer 的视觉风格一致
- [ ] 文案没有明显占位符或旧 OpenClaw-only 表述

## 结论

现在项目已经完成了大部分“工程施工”和“静态验证”，但**还没有完成最终人工联调**。

更准确地说：

- 工程状态：已经到可联调阶段
- 录屏状态：还差一轮人工跑通
- review 状态：**不是 100% 全链路 review 完成，而是 80% 的代码与构建 review 已完成**
