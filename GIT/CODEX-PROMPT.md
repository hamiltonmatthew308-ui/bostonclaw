# Lobster Community — Full Implementation Prompt

## Project Context

Lobster Community is an enterprise AI Agent adoption platform — a pnpm monorepo:

- `apps/openclaw-installer` — Electron desktop installer (React 19, Vite, Zustand, Tailwind, lucide-react)
- `apps/web` — Marketing landing page (React 19, Vite, GSAP)
- `apps/server` — Backend API (Bun + Hono, in-memory store)
- `apps/plugin` — OpenClaw plugin adapter (already working, do NOT modify)
- `packages/shared` — Shared types and template registry

Workspace package names (for `pnpm --filter`): `web`, `server`, `lobster-installer`.

---

## CRITICAL CONTEXT: The Installer Has Two Disconnected Flows

The installer currently contains **two separate UIs that were never merged**:

### Flow A — "Concierge Wizard" (currently rendered)

Located in `apps/openclaw-installer/src/renderer/App.tsx` (1012 lines).

This is what you see when you run the app. It's a 5-step selection wizard:
`scenario → runtime → template → deployment → plan`

It uses `WizardShell.tsx` (a well-designed sidebar + content layout with warm-white editorial styling: `#FDFCF9` bg, `#D4401A` accent, `#0F0F0E` borders, sharp corners, offset box-shadows).

The inline components (`SectionIntro`, `ChoiceCard`, `RecommendationBanner`, `InfoPanel`, `PrimaryPanel`, `StepActions`) are well-designed and should be preserved.

The Flow A wizard lets users browse scenarios/runtimes/templates/deployments and import agent templates via install codes. It calls two IPC handlers: `env:check`, `registry:resolveInstallCode`, and `agent:import`.

### Flow B — "Installation Steps" (orphaned, never rendered)

Six components in `src/renderer/components/`:
- `StepWelcome.tsx` — env check UI
- `StepInstall.tsx` — OpenClaw installation progress
- `StepProvider.tsx` — API key configuration (Zhipu AI / SiliconFlow)
- `StepWeCom.tsx` — WeChat enterprise setup (backend NOT implemented, skip this)
- `StepSkills.tsx` — skills installation
- `StepComplete.tsx` — verification + gateway launch

These components have **working IPC integration** — the main process handlers (`env-check.ts`, `openclaw-installer.ts`, `provider-setup.ts`, `skills-installer.ts`, `service-manager.ts`) are all implemented.

**BUT these Step components cannot be used as-is.** They have three problems:
1. They all import `WizardData` from `'../App'` — a type that does NOT exist in the current App.tsx
2. They use a completely different visual language: Tailwind dark theme (`bg-slate-900`, `text-cyan-400`, `rounded-xl`, `gradient-to-br`, `shadow-cyan-500/25`) — nothing like the editorial warm-white style in WizardShell
3. They manage their own local state and call `updateWizardData()` / `onNext()` / `onPrev()` callbacks that have no provider

**The task is to rewrite these Step components** — preserve their IPC call logic, discard their visual layer and state model, rebuild them in the editorial design system.

---

## TASK 1: Rewrite Installer — Merge Both Flows Into One Working Wizard

### 1A. Create Zustand Store

**New file:** `apps/openclaw-installer/src/renderer/store.ts`

```typescript
import { create } from 'zustand';
import type { LobsterTemplatePackage } from '@lobster/shared';

interface EnvCheckResult {
  os: { platform: string; version: string; isSupported: boolean };
  diskSpace: { total: number; free: number; hasEnoughSpace: boolean };
  nodejs: { installed: boolean; version?: string };
  existingInstall: { exists: boolean };
  canProceed: boolean;
  warnings: string[];
}

interface InstallerStore {
  // -- Navigation --
  currentStep: number;           // 0-based index
  totalSteps: number;            // 6
  completedSteps: Set<number>;

  // -- Step 0: Welcome --
  envCheck: EnvCheckResult | null;
  envChecking: boolean;

  // -- Step 1: Scenario --
  scenarioId: string;            // user selects from 4 scenarios

  // -- Step 2: Template --
  templateId: string;            // user selects a template
  selectedPackage: LobsterTemplatePackage | null;
  installCodeInput: string;
  // These are INFERRED from the selected template, NOT user choices:
  inferredRuntimeId: string;
  inferredDeploymentId: string;

  // -- Step 3: Provider --
  providerConfigs: Array<{
    id: string;
    name: string;
    apiKey: string;
    baseUrl: string;
    defaultModel: string;
    isDefault: boolean;
  }>;

  // -- Step 4: Install --
  installStatus: 'idle' | 'installing' | 'success' | 'error';
  installProgress: number;       // 0-100
  installMessage: string;
  installError: string | null;

  // -- Step 5: Skills --
  selectedSkills: string[];
  skillsInstalling: boolean;
  skillsProgress: { current: number; total: number; skillName: string };

  // -- Step 6: Complete --  (index 5 since we removed WeCom)
  // Actually 6 steps: 0=welcome, 1=scenario, 2=template, 3=provider, 4=install, 5=complete
  // Skills selection is merged into the template step (step 2)
  // Skills installation happens during install step (step 4)
  configWritten: boolean;
  gatewayRunning: boolean;
  gatewayUrl: string | null;
  completionError: string | null;

  // -- Demo mode --
  isDemoMode: boolean;

  // -- Actions --
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  markComplete: (step: number) => void;
  setEnvCheck: (result: EnvCheckResult) => void;
  setScenarioId: (id: string) => void;
  setTemplateId: (id: string) => void;
  setSelectedPackage: (pkg: LobsterTemplatePackage | null) => void;
  setInstallCodeInput: (code: string) => void;
  setInferredIds: (runtimeId: string, deploymentId: string) => void;
  setProviderConfigs: (configs: InstallerStore['providerConfigs']) => void;
  setInstallStatus: (status: InstallerStore['installStatus']) => void;
  setInstallProgress: (progress: number, message: string) => void;
  setInstallError: (error: string | null) => void;
  setSelectedSkills: (skills: string[]) => void;
  setSkillsProgress: (progress: InstallerStore['skillsProgress']) => void;
  setGatewayStatus: (running: boolean, url: string | null) => void;
  setCompletionError: (error: string | null) => void;
  reset: () => void;
}
```

Key design decisions:
- `inferredRuntimeId` and `inferredDeploymentId` are **derived from template selection**, not user input. When user picks a template, call `setInferredIds(pkg.recommendedRuntimeId, pkg.recommendedDeploymentId)`.
- `isDemoMode` is set from `!window.electron?.ipcRenderer` or `import.meta.env.VITE_DEMO_MODE === 'true'`.
- Steps are numbered 0-5 (6 total): Welcome → Scenario → Template → Provider → Install → Complete.
- Skills selection is part of the Template step (step 2), skills installation is part of the Install step (step 4).

### 1B. Extract Reusable UI Components

Move the inline components from the current App.tsx into separate files. **Keep their exact current styling** (these are the good-looking editorial components):

- `src/renderer/components/ui/SectionIntro.tsx` — the eyebrow + title + description block
- `src/renderer/components/ui/ChoiceCard.tsx` — the selectable card with icon, title, subtitle, detail, badges, checkbox
- `src/renderer/components/ui/RecommendationBanner.tsx` — the left-bordered recommendation strip
- `src/renderer/components/ui/InfoPanel.tsx` — the `#F4F1EC` background info box
- `src/renderer/components/ui/PrimaryPanel.tsx` — the white content panel with offset shadow
- `src/renderer/components/ui/StepActions.tsx` — the prev/next button bar

Each component should be a simple props-based React component. Copy the styling exactly from the current App.tsx (lines 74-385). These use inline styles, not Tailwind — keep it that way.

### 1C. Rewrite Step Components

**Important: Do NOT try to patch the existing Step components. Rewrite them from scratch** using:
- The Zustand store for all state
- The editorial design system (inline styles matching WizardShell's aesthetic)
- The IPC call patterns from the old components (preserve the actual `window.electron.ipcRenderer.invoke()` calls and event listeners)

For each step, I'll specify what to keep and what to discard:

#### `StepWelcome.tsx` — REWRITE

**Keep from old:** The `env:check` IPC call pattern, the `config:import` IPC call, the `EnvCheckResult` interface.

**Discard:** All Tailwind classes, the gradient icons, the dark-theme color scheme, the `WizardData` dependency.

**New implementation:**
- Read `envCheck`, `envChecking`, `isDemoMode` from store
- On mount, call `env:check` IPC (or simulate in demo mode with 1s delay → all-pass result)
- Display 4 environment check cards using the editorial card style (`border: 2px solid #0F0F0E`, `background: #F4F1EC`)
- Use `CheckCircle2` (green `#1A7A4A`) for pass, `AlertCircle` (amber `#b1772f`) for warn
- Include the install code input field and "导入配置" button from current Flow A's scenario step (lines 594-638 of current App.tsx)
- Bottom: `StepActions` with only "开始配置" next button, disabled until envCheck passes

#### `StepScenario.tsx` — NEW (extract from current App.tsx)

**Source:** Current App.tsx lines 567-661 (the `scenario` step rendering).

**Implementation:**
- Read `scenarioId` from store, call `setScenarioId` on selection
- Render 4 `ChoiceCard` components for the usage scenarios (from `catalog.ts` `USAGE_SCENARIOS`)
- Show `RecommendationBanner` for the selected scenario
- Include install code input and resolve button (move from StepWelcome if user didn't enter it there)
- Bottom: `StepActions` with prev/next

#### `StepTemplate.tsx` — NEW (merge template selection + skills selection)

**Source:** Current App.tsx lines 703-741 (template step) + StepSkills.tsx skills selection UI.

**Implementation:**
- Read `templateId`, `selectedSkills` from store
- Show template cards from `TEMPLATE_OPTIONS` (catalog.ts) and from `@lobster/shared` LOBSTER_TEMPLATE_PACKAGES
- When user selects a template, call `setTemplateId`, `setSelectedPackage`, and `setInferredIds` using the template's `recommendedRuntimeId` and `recommendedDeploymentId`
- Below template selection, show a skills section: checkboxes for 8 skills, grouped by category (文档/开发/系统), defaulting to all selected
- Show an `InfoPanel` on the right with the selected template's persona summary, recommended skills, and shortcuts
- Bottom: `StepActions` with prev/next

#### `StepProvider.tsx` — REWRITE

**Keep from old:** The PROVIDERS array (Zhipu AI + SiliconFlow definitions), the `validateProvider` logic calling `provider:validate` IPC, the clipboard monitoring `useEffect`, the `provider:save` IPC call in handleNext.

**Discard:** All Tailwind classes (`rounded-xl`, `bg-blue-50`, `border-blue-500`, etc.), the `WizardData` dependency.

**New implementation:**
- Read `providerConfigs`, `isDemoMode` from store
- In demo mode: accept any API key as valid (skip IPC call, just set valid=true after 500ms)
- Two provider cards using editorial styling: `border: 2px solid #0F0F0E` when not selected, `border: 3px solid #0F0F0E` + `box-shadow: 5px 5px 0 #0F0F0E` when selected
- API key input field: `border: 2px solid #0F0F0E`, `background: #FDFCF9`, `font-family: IBM Plex Mono`
- Validate button: `background: #D4401A`, `color: white`
- Success indicator: green `#1A7A4A` text, not a colored pill
- On "下一步", save validated providers to store via `setProviderConfigs`
- Bottom: `StepActions` with prev/next, next disabled until at least 1 provider validated

#### `StepInstall.tsx` — REWRITE

**Keep from old:** The `install:start` IPC call, the `install:progress` event listener pattern, the 7 installation phases with thresholds, the auto-advance on success.

**Discard:** All Tailwind classes, the `WizardData` dependency.

**New implementation:**
- Read `installStatus`, `installProgress`, `installMessage`, `isDemoMode`, `selectedSkills` from store
- On mount, auto-start installation
- In demo mode: simulate progress 0→100% over 5 seconds using setInterval (increment by ~15 every 700ms), then simulate skills installation for 2 more seconds
- In real mode: call `install:start` IPC, listen to `install:progress` events, then call `skills:install` IPC with selected skills
- Progress bar: use a simple `div` with `background: #D4401A`, height 5px, inside a `#DDDDD8` container (same as WizardShell's progress bar style, see WizardShell.tsx lines 100-109)
- 7 installation phases displayed as a checklist with `Check` icons (green `#1A7A4A`) for completed phases
- Error state: red-bordered panel with retry button
- Success: auto-advance to next step after 1.5s
- Bottom: No StepActions (auto-advancing step, no user interaction needed)

#### `StepComplete.tsx` — REWRITE

**Keep from old:** The `config:write` IPC call pattern (with provider configs), the `service:start` IPC call, the `service:status` event listener, the `app:quit` call.

**Discard:** All Tailwind classes, the `WizardData` dependency, the WeChat-related config (backend not implemented).

**New implementation:**
- Read `providerConfigs`, `configWritten`, `gatewayRunning`, `gatewayUrl`, `isDemoMode`, `selectedPackage` from store
- On mount, run verification sequence:
  1. Write config via `config:write` IPC (in demo mode: just set configWritten=true after 500ms)
  2. Start gateway via `service:start` IPC (in demo mode: set gatewayRunning=true, gatewayUrl='http://127.0.0.1:18789' after 1s)
  3. Import selected agent template via `agent:import` IPC if selectedPackage exists
- Show 3 verification steps as a checklist (same style as install phases)
- Success state: large `CheckCircle2` icon, "安装完成" message, summary of what was installed
- Two buttons: "打开控制台" (opens gateway URL) and "完成" (calls `app:quit`)
- In demo mode: show "演示模式 — 实际部署时将启动真实 Gateway 服务" note

### 1D. Rewrite App.tsx

**File:** `apps/openclaw-installer/src/renderer/App.tsx`

**Complete rewrite.** The new App.tsx should be simple (~80 lines):

```tsx
import { WizardShell } from './components/WizardShell';
import { useInstallerStore } from './store';
import { StepWelcome } from './components/StepWelcome';
import { StepScenario } from './components/StepScenario';
import { StepTemplate } from './components/StepTemplate';
import { StepProvider } from './components/StepProvider';
import { StepInstall } from './components/StepInstall';
import { StepComplete } from './components/StepComplete';
// ... icons from lucide-react

const STEPS = [
  { id: 0, label: '环境检查', subtitle: '检查系统环境，确保可以继续安装。' },
  { id: 1, label: '使用场景', subtitle: '先确定怎么用，再反推安装路径。' },
  { id: 2, label: '模板与技能', subtitle: '选择 AI 同事模板和预装技能。' },
  { id: 3, label: 'AI 模型', subtitle: '配置至少一个 AI Provider。' },
  { id: 4, label: '安装', subtitle: '解压和配置所需文件。' },
  { id: 5, label: '完成', subtitle: '验证安装并启动服务。' },
];

function App() {
  const currentStep = useInstallerStore(s => s.currentStep);
  // ... render WizardShell with the step content based on currentStep
}
```

### 1E. Update WizardShell.tsx

**File:** `apps/openclaw-installer/src/renderer/components/WizardShell.tsx`

Change the `WizardStep` type from the old string union to number-based steps:
- `steps` prop: `{ id: number; label: string; subtitle: string }[]`
- `currentStep` prop: `number`
- `stepIcons` prop: `Record<number, typeof Sparkles>`
- `onStepClick` prop: `(stepId: number) => void`

Everything else (the visual design, sidebar layout, progress bar, brand block, mission statement) stays exactly the same.

### 1F. Add Step Transition CSS

**File:** `apps/openclaw-installer/src/renderer/styles/transitions.css` (NEW)

```css
.step-content {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 150ms ease-out, transform 150ms ease-out;
}

.step-content.step-exiting {
  opacity: 0;
  transform: translateY(8px);
}

.step-content.step-entering {
  opacity: 0;
  transform: translateY(-8px);
}
```

In App.tsx, toggle these classes on step change with a ~150ms timeout.

---

## TASK 2: Expand Template Registry

**File:** `packages/shared/src/lobster-registry.ts`

Add 6 new templates to `LOBSTER_TEMPLATE_PACKAGES` following the exact same `LobsterTemplatePackage` structure as the existing 4:

| id | name | category | department |
|----|------|----------|------------|
| `hr-onboard-v1` | 入职引导员 | hr | 人事部 |
| `legal-contract-v1` | 合同审查员 | legal | 法务部 |
| `procurement-v1` | 采购比价员 | procurement | 采购部 |
| `qa-report-v1` | 质检报告员 | quality | 质量部 |
| `email-draft-v1` | 邮件助手 | general | 通用 |
| `travel-plan-v1` | 出差规划员 | admin | 行政部 |

For each template, provide:
- `installCode`: `lobster://install/{id}`
- `templateId`: same as id
- `cloneCount`: random 40-120
- `rating`: random 4.5-4.9
- `recommendedScenarioId`: `'desktop-personal'` for most, `'im-remote'` for email-draft
- `recommendedRuntimeId`: `'openclaw'` for all
- `recommendedDeploymentId`: `'local-light'` for most
- `persona`: object with `systemPrompt` (2-3 sentences describing the role in Chinese), `voiceStyle` (e.g. "专业严谨" or "简洁高效"), `responseFormat` (e.g. "结构化清单" or "分析报告")
- `dependencies`: `{ skills: [...relevant skill ids], extensions: [] }`
- `shortcuts`: 3 shortcut objects each with `{ command: string, description: string }`

Example for hr-onboard-v1:
```typescript
{
  id: 'hr-onboard-v1',
  name: '入职引导员',
  description: '帮助新员工快速了解公司制度、福利和入职流程。',
  category: 'hr',
  installCode: 'lobster://install/hr-onboard-v1',
  templateId: 'hr-onboard-v1',
  cloneCount: 67,
  rating: 4.7,
  recommendedScenarioId: 'desktop-personal',
  recommendedRuntimeId: 'openclaw',
  recommendedDeploymentId: 'local-light',
  persona: {
    systemPrompt: '你是一位耐心的入职引导员。你熟悉公司所有制度、流程和福利政策，能用通俗易懂的语言帮助新同事快速融入。',
    voiceStyle: '亲切耐心',
    responseFormat: '分步指引',
  },
  dependencies: {
    skills: ['pdf', 'docx'],
    extensions: [],
  },
  shortcuts: [
    { command: '/入职清单', description: '生成新员工入职待办清单' },
    { command: '/制度查询', description: '查询公司制度和规定' },
    { command: '/培训安排', description: '查看培训日程和内容' },
  ],
}
```

Also update `apps/openclaw-installer/src/renderer/data/catalog.ts`:
- Add corresponding entries to `TEMPLATE_OPTIONS` array for all 6 new templates
- Each entry needs: `id`, `name`, `department`, `outcome`, `description`, `badges` (2-3 string array), `contents` (4-5 bullet points describing what the template includes)

---

## TASK 3: Server — Seed Demo Data at Module Init

**File:** `apps/server/src/store.ts`

The server uses Bun's `export default { port, fetch }` pattern — there is no explicit `listen()` callback. Seed data must be added at **module initialization time** in `store.ts`, not in `index.ts`.

Add a `seedDemoData()` function at the bottom of `store.ts` and call it immediately:

```typescript
function seedDemoData() {
  // 1. Register 6 mock agents
  const mockAgents = [
    { id: crypto.randomUUID(), name: '纪要小助手', owner: '张明', department: '市场部', expertise: ['竞品分析', '市场调研'], skills: ['pdf', 'docx'], client: 'openclaw' },
    { id: crypto.randomUUID(), name: '报价精灵', owner: '李芳', department: '销售部', expertise: ['客户管理', '报价'], skills: ['xlsx', 'pdf'], client: 'openclaw' },
    { id: crypto.randomUUID(), name: '代码审查员', owner: '王磊', department: '研发部', expertise: ['代码审查', '技术文档'], skills: ['code-assist', 'terminal'], client: 'openclaw' },
    { id: crypto.randomUUID(), name: '招聘助手', owner: '陈静', department: '人事部', expertise: ['招聘', '培训'], skills: ['pdf', 'docx'], client: 'openclaw' },
    { id: crypto.randomUUID(), name: '质检报告员', owner: '赵伟', department: '质量部', expertise: ['质检', '合规'], skills: ['xlsx', 'pdf'], client: 'openclaw' },
    { id: crypto.randomUUID(), name: '比价分析师', owner: '刘洋', department: '采购部', expertise: ['供应商管理', '比价'], skills: ['xlsx'], client: 'openclaw' },
  ];

  // Store each agent; mark 4 of 6 as online (set lastSeen to Date.now())
  // Add them to the agents map in store

  // 2. Generate 25 mock feed events spread over the last 24 hours
  // Mix types: agent-online, question-asked, question-answered, skill-installed, collaboration
  // Timestamps: Date.now() - Math.random() * 24 * 60 * 60 * 1000, sorted chronologically

  // 3. Mark agents[0..3] as online, agents[4..5] as offline (lastSeen = 2 hours ago)
}

// Run seed immediately at module load
seedDemoData();
```

Adapt this to the actual store data structures used in `store.ts`. Check the existing `Agent` interface from `@lobster/shared` for the correct shape.

---

## TASK 4: Web Landing Page — Refactor and Visual Update

**File:** `apps/web/src/App.tsx` (currently 496 lines, monolithic) and `apps/web/src/App.css` (898 lines)

### 4A. Component Extraction

Split the monolithic App.tsx into:
- `src/components/HeroSection.tsx`
- `src/components/LearningSection.tsx`
- `src/components/GallerySection.tsx`
- `src/components/CommunitySection.tsx`
- `src/components/NavPill.tsx`
- `src/components/TemplateCard.tsx`

App.tsx becomes a thin shell (~60 lines) that composes these sections and manages the API polling state.

### 4B. Visual Update

Update colors and typography to match the installer's editorial system:

**Typography** — Add Google Fonts to `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Serif+Display&family=IBM+Plex+Mono:wght@400;600;700&family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**Color updates in App.css:**
- Hero section: keep dark background `#0F0F0E` (this is fine, creates visual impact)
- Learning section: change to warm white `#FAF8F5` background
- Gallery section: change to warm white `#FAF8F5` background
- Community section: keep dark `#0F0F0E` (radar/dashboard feel)
- Accent color: change from whatever cyan/purple it currently uses to `#D4401A` (copper-orange)
- Card style: change from glassmorphic (blur, transparency) to editorial (`background: #FDFCF9`, `border: 2px solid #0F0F0E`, `box-shadow: 4px 4px 0 #0F0F0E`, `border-radius: 0`)
- Headings: use `DM Serif Display` for section titles, `Archivo Black` for labels
- Body text: `Instrument Sans`
- Monospace labels: `IBM Plex Mono`

### 4C. Gallery Enhancement

- The Gallery section already reads from `@lobster/shared` LOBSTER_TEMPLATE_PACKAGES — it will automatically show all 10 templates after Task 2
- Add a "下载安装桥" button in both hero section and gallery section. Make it a prominent button styled like the installer's primary CTA: `background: #D4401A`, `color: #fff`, `border: none`, `box-shadow: 4px 4px 0 #0F0F0E`, `font-family: Archivo Black`. For now, `onClick` shows `alert('安装包即将上线，敬请期待！')`
- Ensure category sidebar shows correct counts for the expanded template list

### 4D. CSS Split

Split `App.css` into:
- `src/styles/variables.css` — CSS custom properties (colors, fonts, spacing)
- `src/styles/hero.css`
- `src/styles/learning.css`
- `src/styles/gallery.css`
- `src/styles/community.css`
- `src/styles/nav.css`

Import all from a single `src/styles/index.css` which App.tsx imports.

---

## TASK 5: Demo Launch Script and Recording Guide

### 5A. Demo Launch Script

**New file:** `scripts/demo.sh`

```bash
#!/bin/bash
set -e

echo "🦞 Starting Lobster Community Demo..."
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Start server (Bun)
echo "Starting server on :3888..."
cd "$REPO_ROOT/apps/server" && bun run src/index.ts &
SERVER_PID=$!

# Wait for server
sleep 2
if curl -sf http://localhost:3888/health > /dev/null 2>&1; then
  echo "  ✓ Server healthy"
else
  echo "  ⚠ Server may not be ready yet"
fi

# Start web dev server
echo "Starting web on :5173..."
cd "$REPO_ROOT/apps/web" && npx vite --port 5173 &
WEB_PID=$!

# Start installer via pnpm (this starts both Vite renderer AND Electron main process)
echo "Starting installer (Electron)..."
cd "$REPO_ROOT" && VITE_DEMO_MODE=true pnpm --filter lobster-installer dev &
INSTALLER_PID=$!

echo ""
echo "=== Lobster Demo Running ==="
echo "  Web:       http://localhost:5173"
echo "  Server:    http://localhost:3888"
echo "  Installer: Electron window (demo mode)"
echo ""
echo "Press Ctrl+C to stop all"

cleanup() {
  echo "Stopping services..."
  kill $SERVER_PID $WEB_PID $INSTALLER_PID 2>/dev/null
  wait 2>/dev/null
}
trap cleanup EXIT INT TERM
wait
```

Make executable: `chmod +x scripts/demo.sh`

### 5B. Demo Recording Guide

**New file:** `docs/demo-recording-guide.md`

```markdown
# 演示录屏指南

## 准备工作
1. 运行 `./scripts/demo.sh` 启动所有服务
2. 确认三个服务都启动成功
3. 打开 OBS 或系统录屏工具，分辨率 1920×1080

## 录制流程（总时长 3-5 分钟）

### 第一幕：问题展示（30 秒）
- 打开浏览器 http://localhost:5173
- 展示首页，旁白：
  "公司推广 AI Agent，但员工面临三个问题：不知道装什么、不会配置、装了不知道干什么"

### 第二幕：浏览模板库（45 秒）
- 滚动到 Gallery 区域
- 展示不同部门的 AI 同事模板（会议纪要员、销售情报员、质检报告员……）
- 点击复制安装码按钮
- 旁白："Lobster 提供预配置的角色模板，每个部门都能找到对应的 AI 同事"

### 第三幕：安装流程（90 秒）
- 切换到 Electron Installer 窗口
- 按步骤演示：
  1. 环境检查 → 通过
  2. 选使用场景 → "桌面个人使用"
  3. 选模板 → "会议纪要员" + 勾选技能
  4. 配置 Provider → 粘贴 API Key → 验证通过
  5. 安装 → 进度条推进 → 完成
  6. 验证 → Gateway 启动 → 成功
- 重点展示：一键安装、自动配置

### 第四幕：社区雷达（30 秒）
- 回到 Web 浏览器
- 展示 Community 区域：在线 Agent 列表、活跃部门、24h 动态
- 旁白："管理者实时掌握 AI 在各部门的采用情况"

### 第五幕：总结（15 秒）
- 总结画面
- 旁白："从安装到上手，从 2 小时缩短到 10 分钟。全公司 1500 人的 AI 推广，有了标准化路径"
```

---

## TASK 6: Root Scripts

**File:** `package.json` (root, at `/Users/jouska/Projects/lobster-community/package.json`)

Update the `scripts` field. The current scripts already have some correct entries. Ensure the final result is:

```json
{
  "scripts": {
    "dev": "pnpm -r --parallel run dev",
    "dev:web": "pnpm --filter web dev",
    "dev:server": "pnpm --filter server dev",
    "dev:installer": "pnpm --filter lobster-installer dev",
    "build": "pnpm -r run build",
    "typecheck": "pnpm -r run typecheck",
    "demo": "bash scripts/demo.sh"
  }
}
```

Also ensure `apps/server/package.json` has:
```json
{
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "start": "bun src/index.ts"
  }
}
```

---

## Design System Reference (for ALL UI work)

```
Colors:
  --bg-page:      #0F0F0E   (outer background, Electron window)
  --bg-primary:   #FDFCF9   (card/content background)
  --bg-secondary: #F4F1EC   (sidebar, info panels)
  --accent:       #D4401A   (copper-orange, CTAs, active states)
  --success:      #1A7A4A   (green, pass states)
  --warn:         #b1772f   (amber, warning states)
  --text-primary: #0F0F0E
  --text-body:    #2A2A2A
  --text-secondary:#666666
  --text-muted:   #999999
  --border:       #0F0F0E   (primary borders)
  --border-light: #DDDDD8   (secondary borders)

Typography:
  Display:  'DM Serif Display', Georgia, serif       (section titles)
  Heading:  'Archivo Black', sans-serif               (labels, counters)
  Body:     'Instrument Sans', sans-serif             (body text, buttons)
  Mono:     'IBM Plex Mono', monospace                (code, tags, metadata)

Borders & Shadows:
  Primary border:   2-3px solid #0F0F0E
  Light border:     2px solid #DDDDD8
  Offset shadow:    4-5px 4-5px 0 #0F0F0E            (brutalist style)
  Active shadow:    5px 5px 0 #0F0F0E
  Border radius:    0                                  (sharp corners everywhere)

Cards:
  Selected:   border 3px #0F0F0E, shadow 5px 5px 0 #0F0F0E, transform translate(-2px, -2px)
  Unselected: border 2px #DDDDD8, shadow 3px 3px 0 #DDDDD8

Buttons:
  Primary:    bg #D4401A, color #fff, shadow 4px 4px 0 #0F0F0E, font Archivo Black
  Secondary:  bg #FDFCF9, border 2px #0F0F0E, shadow 3px 3px 0 #0F0F0E, font Instrument Sans
  Disabled:   bg #DDDDD8, color #999999, no shadow

Inputs:
  border: 2px solid #0F0F0E
  background: #FDFCF9
  font: IBM Plex Mono, 13px
  padding: 13px 16px
```

---

## Execution Order

1. **Task 2** — Expand template registry (shared data, other tasks depend on it)
2. **Task 1** — Rewrite installer (the main deliverable, largest task)
3. **Task 3** — Server seed data (needed for web to show content)
4. **Task 4** — Web refactor and visual update
5. **Task 6** — Root scripts
6. **Task 5** — Demo scripts (final step)

## Verification

After all tasks complete, run these checks:

```bash
# 1. Server
cd apps/server && bun run src/index.ts &
# Verify: curl http://localhost:3888/api/agents → should return 6 mock agents (4 online)
# Verify: curl http://localhost:3888/api/feed → should return 25 mock events

# 2. Web
cd apps/web && npx vite --port 5173
# Verify: open http://localhost:5173
# Verify: Gallery shows 10 template cards
# Verify: Community section shows live data from server

# 3. Installer
VITE_DEMO_MODE=true pnpm --filter lobster-installer dev
# Verify: Electron window opens with WizardShell (left sidebar + content area)
# Verify: 6 steps visible in sidebar: 环境检查, 使用场景, 模板与技能, AI 模型, 安装, 完成
# Verify: Can walk through all 6 steps in demo mode
# Verify: Install step simulates progress bar 0-100%
# Verify: Complete step shows success state
```

## Important Rules

- Do NOT add new npm dependencies. The project already has: React 19, Zustand, Tailwind, lucide-react, GSAP, Hono. Use only these.
- Do NOT modify main process code (`apps/openclaw-installer/src/main/`). It works correctly.
- Do NOT modify the plugin (`apps/plugin/`). It works correctly.
- Do NOT add React Router. Both apps are single-page.
- Keep ALL user-facing text in Chinese (简体中文).
- Use inline styles for the installer (matching existing WizardShell pattern). The installer does NOT use Tailwind for the editorial components — the old Step components used Tailwind but those are being rewritten.
- Sharp corners, offset shadows, monospace labels, warm whites. No rounded corners, no gradients, no glassmorphism in the installer.
