# MiniMax — r03 — 社区网站架构方案

## 身份
agent-id: minimax | model: MiniMax-M2-highspeed

## 立场
Architect（社区网站方向）

## 要点

### 1. 参考项目 review 结论

**ClawX（GUI 安装器）**
- React 19 + Vite + electron-builder，用 pnpm
- 完整 Electron app，不是安装器——它本身就是 OpenClaw 的桌面客户端
- 架构很重：gateway/manager/lifecycle-controller 一整套，服务化
- **对 lobster 的意义**：安装器不需要学它。ClawX 是运行时客户端，我们是路由分发器，职责完全不同

**FreeClaw（本地版）**
- Python + Tkinter，Windows 专用
- 核心逻辑：下载依赖 → 写入 `data/` 目录 → 生成启动脚本
- **对 lobster 的意义**：FreeClaw 路径（路径C）的安装逻辑可以直接复用 FreeClaw 的设计思路——Ollama 下载 + 本地模型选择

---

### 2. 社区网站架构方案

**整体判断：改造比重写划算。**

现有 `apps/web` 是单页 React + Vite，Tailwind CSS 设计系统已成型（paper/ink/copper 色板、IBM Plex Mono + DM Serif Display 字体）。复用这套视觉系统，加路由层。

#### 文件结构

```
apps/web/src/
├── main.tsx              # 入口（不动）
├── App.tsx               # 改造：加 React Router
├── index.css             # 全局样式（不动）
├── pages/
│   ├── Home.tsx          # 重命名自现有 HeroSection 等的整合
│   ├── Templates.tsx     # ClawGo 模板市场（新建）
│   ├── Report.tsx        # /report 静态汇报页（新建）
│   └── Download.tsx     # 下载分发页（新建）
├── components/           # 现有 components/ 保留
│   ├── SiteNav.tsx       # 改造：加路由链接
│   ├── HeroSection.tsx
│   ├── TemplateLibrarySection.tsx   # → 复用为 Templates.tsx 的一部分
│   └── ...
└── hooks/
    └── useHubData.ts    # 改造：支持路由参数
```

#### 路由设计

用 `react-router-dom`（已是 ClawX 依赖，可共享）。

```tsx
// App.tsx
<BrowserRouter>
  <SiteNav />
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/templates" element={<Templates />} />
    <Route path="/templates/:templateId" element={<TemplateDetail />} />
    <Route path="/report" element={<Report />} />
    <Route path="/download" element={<Download />} />
  </Routes>
</BrowserRouter>
```

#### 各页面职责

**`/home`（`Home.tsx`）**
- 保留现有 HeroSection + TemplateLibrarySection
- 新增：安装器下载区（`.dmg` / `.exe` 直接链接）
- "下载分发区"做成独立 Section，不做独立页面（减少跳转）

**`/templates`（`Templates.tsx`）**
- 基于 `packages/shared/src/lobster-registry` 的 `LOBSTER_TEMPLATE_PACKAGES`
- 分类侧边栏（复用 `TemplateLibrarySection` 的 sidebar）
- 卡片网格：显示 name/description/clones/rating
- 一键复制 installCode（`lobster://install/xxx` 格式）
- 搜索 + 分类过滤（category 字段）

**`/report`（`Report.tsx`）**
- 纯展示组件，静态数据硬编码
- 内容：项目介绍、架构图、价值量化（"替代实习生"模型）、应用场景
- **不需要 server**，纯 React 组件

**`/download`（`Download.tsx`）**
- 显示版本列表（从 GitHub Releases API 拉取，或本地 `versions.json`）
- 两个主下载按钮：`.dmg` 和 `.exe`
- 7 个大厂版下载链接（路径A，直接跳转 URL）
- FreeClaw / Hermes Agent 独立下载区

---

### 3. ClawGo 模板市场具体设计

参考 clawgo.me 交互模式：

```tsx
// Templates.tsx 核心逻辑
const [activeCategory, setActiveCategory] = useState<string>('all')
const [searchQuery, setSearchQuery] = useState('')

const filtered = LOBSTER_TEMPLATE_PACKAGES.filter(t => {
  const matchCategory = activeCategory === 'all' || t.category === activeCategory
  const matchSearch = t.name.includes(searchQuery) || t.description.includes(searchQuery)
  return matchCategory && matchSearch
})

return (
  <div className="library-layout">
    <aside className="library-sidebar">
      <CategorySidebar active={activeCategory} onChange={setActiveCategory} />
    </aside>
    <main>
      <SearchBar value={searchQuery} onChange={setSearchQuery} />
      <div className="template-grid">
        {filtered.map(pkg => (
          <TemplateCard
            key={pkg.id}
            pkg={pkg}
            onCopy={() => copyInstallCode(pkg.installCode)}
          />
        ))}
      </div>
    </main>
  </div>
)
```

**installCode 复制体验**：
- 点击复制 → 复制 `lobster://install/{templateId}` 到剪贴板
- Toast 提示"已复制安装码"
- 用户打开自己的 OpenClaw → 粘贴即可安装

---

### 4. /report 静态页内容规划

比赛用 10 分钟汇报。`/report` 页是赛前预览、也是评委现场扫码看的备胎。

**必须包含**：
- 项目一句话定位（"企业 AI Agent 的统一安装桥"）
- 架构图（简约版：安装器 → 模板中心 → 社区）
- 价值量化：实习生替代模型（1 人/月 5000 元 × N 人）
- 落地场景截图（虚拟数据 + 模板截图）
- 团队介绍（可选）

**不做**：
- 不做动画
- 不做深链接
- 纯静态，内容硬编码，不依赖 server

---

### 5. 技术依赖

需要新增的依赖：

```bash
pnpm add react-router-dom
```

不需要新增构建工具。Vite 已经支持 SPA 路由（BrowserRouter）。

---

### 6. 与 installer 的边界

| 模块 | 归属 | 说明 |
|------|------|------|
| 安装器 Electron app | `apps/openclaw-installer` | 独立构建，产出 .dmg/.exe |
| 网站 | `apps/web` | 纯静态 SPA，CDN 部署 |
| 模板注册表 | `packages/shared` | 共享，两边都用 |

**关键：安装器的 .dmg/.exe 通过 GitHub Releases 分发，网站 `/download` 页只存链接。**

---

## 建议

### 对 Ludviq 的任务分配
- **Kimi's额度** → 安装器（5条路径的路由逻辑 + 环境检测）
- **我的额度** → 网站（路由 + 模板市场 + report 页）
- 其他 agent → 辅助 architecture review

### 安装器补充建议（给 Kimi 参考）
- 路径 A 的 7 个大厂链接做成静态配置表，不需要写死在 UI 里
- 路径 B 的 Node.js 检测参考 `apps/openclaw-installer/src/main/modules/node-runtime.ts`（已有）
- 路径 C 的 FreeClaw 安装可以调用 FreeClaw 的 `main.py` 或做 Python 环境检测

---

## 投票

- Architect（网站） → minimax（我的额度负责这个）
- Implementer（网站） → minimax
- Reviewer（整体） → gemini
