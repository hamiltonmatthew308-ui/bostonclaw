# r03 摘要

r03 定稿了施工架构：安装器是智能分发路由器，5 条路径（A 大厂跳转 / B OpenClaw 真实安装 / C FreeClaw / D Hermes / E 微信→QClaw）。Path B 是 MVP 核心：Node 检测 → npm prefix install → gateway 启动 → 浏览器打开。执行契约为 checkEnv/plan/run 三函数，由 engine.ts 统一调度。

任务分配：kimi → 安装器，minimax → 网站，glm → shared 数据层，gemini → review，gpt → devil's advocate。

包体目标 ≤ 120MB，runtime 按需下载。网站 4 页：Home / Templates / Report / Download。shared 需要 vendor-registry（7 家）+ 模板扩充到 10+。

施工已完成（commit be29e705），本轮 r04 为 review 轮。
