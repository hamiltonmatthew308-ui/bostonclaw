# Resolution — r04 施工 Review

## 议题
r03 施工成果（commit be29e705）的全量 review，找 bug、定优先级、确认下一步。

## 参与发言
| Agent | 角色 | 状态 |
|-------|------|------|
| Kimi | implementer (installer) | ✅ 发言 |
| Minimax | implementer (website) | ✅ 发言 |
| GLM | implementer (shared) | ✅ 发言（Claude 代笔） |
| GPT | devil's advocate | ✅ 发言 |
| Gemini | reviewer | ❌ 频限，未参与 |
| Claude | orchestrator | ❌ 频限，resolution 由 GLM 会话代写 |

## 共识

### 全员一致（无争议）
1. **网站下载链接全 `#`** — 比赛当场死亡级，必须换成真实地址
2. **Windows `openclaw.cmd` 路径缺 `bin/`** — 安装后找不到可执行文件
3. **Gateway 进程泄露** — `spawn` 后缺 `unref()`、缺 PID 持久化、缺退出清理
4. **`https.get` 不走代理** — 公司内网用户第一步下载就挂
5. **`shell: true` 被 AV 拦截** — 企业 Windows 演示高风险
6. **环境检测被冗余调用 3 次** — engine 契约应"检测一次、传递消费"
7. **engine.ts catch 里 `logs: []` 丢弃诊断信息** — 进程间契约破坏
8. **`<a href="/">` 破坏 SPA** — 3 个子页返回链接需改 `<Link to="/">`
9. **Report.tsx 写"10 个模板"实际 44 个** — 文案严重过时

### GPT 独家发现（其他 agent 未覆盖）
10. **Provider 没进 Path B 配置** — `openclaw.json` 写 `providers: []`，安装成功但不可用。这是"成品 vs demo"的分水岭
11. **Windows bin 路径非确定** — 不只是缺 `bin/`，硬编码拼接本身就有风险，应动态查询
12. **main 侧缺 run mutex** — StrictMode/重入/重复点击可能并发跑两次安装
13. **60s 硬超时对弱网不友好** — 应改"无数据超时"而非"总时长超时"

### GLM 独家发现
14. **测试垃圾文件已不存在** — 和 Kimi 代笔版本说法不同，glob 搜索零结果，可能已被清理
15. **web 层重声明 shared 类型** — `apps/web/src/types.ts` 手动重写 `Agent`/`FeedItem` 而非 `import from '@lobster/shared'`，字段当前一致但未来会静默分叉

## 最终优先级裁定

### P0 — 比赛前必须修（共 8 项）

| # | 事项 | 负责 | 分水岭 |
|---|------|------|--------|
| 1 | Provider 写入 openclaw 配置（闭环可用性） | kimi | 成品 vs demo |
| 2 | 代理下载支持（https-proxy-agent） | kimi | 公司现场能不能装 |
| 3 | Windows shell:false + 动态 bin 路径 | kimi | AV 拦截 + 路径可靠性 |
| 4 | Gateway unref + PID 持久化 + 退出清理 | kimi | 进程泄露 |
| 5 | main 侧 run mutex + runId | kimi | 双 run 自爆 |
| 6 | 网站下载链接 → GitHub Release | minimax | 评委点击当场死亡 |
| 7 | Report.tsx "10 个模板" → 44 | minimax | 文案虚假 |
| 8 | `<a href="/">` → `<Link to="/">` | minimax | SPA 体验 |

### P1 — 应修（共 6 项）

| # | 事项 | 负责 |
|---|------|------|
| 9 | 下载 timeout 改动态/无数据超时（≥5min） | kimi |
| 10 | engine.ts 吞日志修复（catch 里带出 logs） | kimi |
| 11 | env 三重检测去重（plan/run 接收 env 参数） | kimi |
| 12 | `dialog:openFile` 白名单/handler 对齐 | kimi |
| 13 | web 用 shared import 替代重声明 | minimax |
| 14 | Preflight 检测三态视觉（OK/Will install/Needs action） | kimi |

### P2 — 有余力再修（共 5 项）

| # | 事项 | 负责 |
|---|------|------|
| 15 | Templates 搜索框 | minimax |
| 16 | vendor URL 换真实地址 | glm |
| 17 | shared build `.js` 扩展名兼容性验证 | glm |
| 18 | GatewayManager 死代码清理（tray/） | kimi |
| 19 | 下载失败残片清理 | kimi |

## 行动计划

### 今天下午（4/15）— 三线并行

**Kimi（安装器，工作量最大）**
1. Provider 注入 openclaw 配置（P0 #1，最高优先）
2. 加 https-proxy-agent 支持（P0 #2）
3. Windows shell:false + 动态查 bin 路径（P0 #3）
4. Gateway unref + PID + before-quit 清理（P0 #4）
5. main 侧 run mutex（P0 #5）

**Minimax（网站）**
1. 下载链接改 GitHub Release 占位 → 等 kimi 打包后填真实地址（P0 #6）
2. Report 文案 "10 个模板" → 动态读 `LOBSTER_TEMPLATE_PACKAGES.length`（P0 #7）
3. `<a href="/">` → `<Link to="/">`（P0 #8）

**GLM（shared）**
1. vendor-registry URL 换真实 GitHub 链接（P2 #16）
2. 验证 `pnpm build` 下 `.js` 扩展名兼容性（P2 #17）

### 明天（4/16）
- 全量 `pnpm install && pnpm build && pnpm dist`
- kimi 打包 .exe/.dmg 上传 GitHub Release
- minimax 更新网站下载链接为真实地址
- P1 项根据时间情况推进

### 赛前（4/20 前）
- **录 demo 视频** — Path B 从 0 到 gateway 就绪的完整闭环，作为现场演示备份
- 准备降级方案：离线安装包 + 视频备份 + PDF 路演材料

## 风险评估

GPT 的判断最尖锐："Provider 没进配置"是**成品 vs demo 的分水岭**。如果安装成功但 agent 不可用，评委一眼看穿。今天下午 kimi 的第一优先应该是这个，不是代理支持。

代理支持和 AV 规避是"公司现场能不能装"的线——如果比赛在自家场地演示，这两个可以降为 P1；如果要去客户/评委现场，必须 P0。

**demo 视频是最终保险。** 即使现场所有 P0 都炸了，视频能跑就不算白来。

## 产出物更新
- decisions.md: D004 施工 review 优先级裁定
- changelog.md: 追加 r04 resolution 记录
- tasks.md: 按 P0/P1/P2 拆分任务看板
