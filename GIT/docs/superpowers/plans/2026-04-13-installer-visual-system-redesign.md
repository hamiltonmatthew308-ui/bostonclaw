# Installer Visual System Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Lobster installer UI into a balanced concierge workspace with a quieter background, clearer hierarchy, and lower information density.

**Architecture:** Keep the existing Electron/React installer flow and data model intact, but replace the visual system and page composition around it. The rewrite stays concentrated in the renderer shell, shared step components, and page-level layout blocks so functional behavior does not regress while visual density drops sharply.

**Tech Stack:** React, TypeScript, Vite, Electron renderer, inline styles, global CSS, lucide-react

---

## File Structure

### Modify

- `apps/openclaw-installer/src/renderer/styles/globals.css`
  - Replace the current paper-gradient background with a quieter copper-editorial token system.
- `apps/openclaw-installer/src/renderer/components/WizardShell.tsx`
  - Rebuild the frame into the approved `B2. Balanced Concierge` layout.
- `apps/openclaw-installer/src/renderer/App.tsx`
  - Simplify step composition, reduce competing panels, restyle helper components, and clarify success/error states.

### Verify

- `apps/openclaw-installer/package.json`
  - Use existing scripts for validation only.
- `docs/superpowers/specs/2026-04-13-installer-visual-system-redesign-design.md`
  - Reference for acceptance criteria and layout intent.

---

### Task 1: Rewrite Global Visual Tokens And Background

**Files:**
- Modify: `apps/openclaw-installer/src/renderer/styles/globals.css`

- [ ] **Step 1: Replace the noisy background system with quieter copper-editorial tokens**

Use this token direction in `:root`:

```css
:root {
  --background: 36 39% 93%;
  --foreground: 24 23% 16%;
  --card: 42 38% 97%;
  --card-foreground: 24 23% 16%;
  --primary: 25 56% 48%;
  --primary-foreground: 38 75% 97%;
  --secondary: 34 29% 89%;
  --secondary-foreground: 24 23% 16%;
  --muted: 35 24% 91%;
  --muted-foreground: 26 15% 41%;
  --accent: 31 52% 79%;
  --accent-foreground: 24 23% 16%;
  --border: 31 19% 80%;
  --input: 40 34% 96%;
  --ring: 25 56% 48%;
  --radius: 1rem;
}
```

- [ ] **Step 2: Replace the current radial-heavy body background**

Update `body` and `body::before` so the app uses a quiet tonal field instead of decorative gradients:

```css
body {
  background:
    linear-gradient(180deg, #f5ede0 0%, #efe4d5 52%, #e9dbc8 100%);
  color: hsl(var(--foreground));
  font-family: "Avenir Next", "Segoe UI", "PingFang SC", sans-serif;
}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(rgba(117, 92, 69, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(117, 92, 69, 0.02) 1px, transparent 1px);
  background-size: 32px 32px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.16), transparent 74%);
}
```

- [ ] **Step 3: Keep only low-contrast utility chrome**

Retain scrollbar styling, but keep it subordinate:

```css
::-webkit-scrollbar-thumb {
  background: rgba(111, 87, 65, 0.22);
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(111, 87, 65, 0.34);
}
```

- [ ] **Step 4: Verify the renderer still builds**

Run:

```bash
pnpm --filter lobster-installer typecheck
pnpm --filter lobster-installer build:vite
```

Expected:

- both commands pass
- no renderer type errors

---

### Task 2: Rebuild The Frame Into Balanced Concierge

**Files:**
- Modify: `apps/openclaw-installer/src/renderer/components/WizardShell.tsx`

- [ ] **Step 1: Reduce left-rail dominance**

Change the shell proportions and hierarchy to this structure:

```tsx
<div style={{ display: 'flex', maxWidth: '1220px' }}>
  <aside style={{ width: '292px' }}>
    {/* brand */}
    {/* compact progress */}
    {/* step list */}
    {/* small summary block */}
  </aside>
  <section style={{ flex: 1 }}>
    {/* top title row */}
    {/* single content workspace */}
  </section>
</div>
```

Rules:

- sidebar stays useful but visually quieter
- step subtitles stay visible but lighter
- active state uses copper, not large contrast blocks

- [ ] **Step 2: Replace decorative gradients inside the shell**

Use flatter paper surfaces:

```tsx
background: 'rgba(250, 245, 237, 0.96)'
border: '1px solid rgba(117, 88, 51, 0.12)'
boxShadow: '0 24px 48px rgba(91, 70, 49, 0.10)'
```

Avoid:

- glossy gradients
- large orange surfaces
- heavy shadows on every nested block

- [ ] **Step 3: Tighten the right-side header**

Use a single strong title zone:

```tsx
<div>
  {headerKicker ? <div>{headerKicker}</div> : null}
  <h2>{steps[currentIndex]?.label}</h2>
  <p>{steps[currentIndex]?.subtitle}</p>
</div>
```

Constraints:

- header should feel like a chapter heading
- step badge stays compact and utility-like

- [ ] **Step 4: Verify shell-level interactions still work**

Run:

```bash
pnpm --filter lobster-installer typecheck
pnpm --filter lobster-installer build:vite
```

Expected:

- step navigation still compiles
- no prop/type regressions in `WizardShell`

---

### Task 3: Reduce Per-Step Density In `App.tsx`

**Files:**
- Modify: `apps/openclaw-installer/src/renderer/App.tsx`

- [ ] **Step 1: Demote helper surfaces and strengthen one primary action per screen**

Update shared helper components so they reflect the spec:

```tsx
function RecommendationBanner(...) {
  return (
    <div style={{ padding: '14px 16px', borderRadius: 18 }}>
      <div>{title}</div>
      <div>{detail}</div>
    </div>
  );
}

function InfoPanel(...) {
  return (
    <div style={{ padding: 18, borderRadius: 20 }}>
      <div>{title}</div>
      <div>{children}</div>
    </div>
  );
}
```

Goal:

- recommendation strip reads as a decision, not a hero card
- info panels read as support, not peers to the main task

- [ ] **Step 2: Restructure the scenario step**

Keep only:

- `SectionIntro`
- one recommendation strip
- one main block for scenario choices and install-code import
- one support block for environment summary

Implementation target:

```tsx
<div style={{ display: 'grid', gap: 18 }}>
  <MainScenarioWorkspace />
  <InfoPanel title="环境与判断" />
</div>
```

Where the main workspace combines:

- scenario cards
- install code input
- resolve status

- [ ] **Step 3: Restructure runtime, template, and deployment**

For each of these steps:

- keep the card grid as the primary block
- keep only one support row beneath it
- remove duplicate explanatory copy where `SectionIntro`, banner, and panels say the same thing

Use this pattern:

```tsx
<>
  <SectionIntro ... />
  <RecommendationBanner ... />
  <PrimaryChoiceGrid />
  <InfoPanel title="当前推荐与影响">...</InfoPanel>
  <StepActions ... />
</>
```

- [ ] **Step 4: Rebuild the plan/result screen as a handoff page**

The final screen should be structured as:

```tsx
<>
  <SectionIntro ... />
  <RouteSummaryBlock />
  <PrimaryImportBlock />
  {importResult ? <ImportResultBlock /> : null}
  <NextStageNotes />
  <StepActions ... />
</>
```

Important:

- the import CTA must be the strongest element on the page
- success/failure block must look like a handoff receipt, not a console dump

- [ ] **Step 5: Verify the flow still works**

Run:

```bash
pnpm --filter lobster-installer typecheck
pnpm --filter lobster-installer build:vite
```

Expected:

- all step branches compile
- install-code resolution path still typechecks
- import result rendering still builds cleanly

---

### Task 4: Accessibility, State Pass, And Manual Acceptance

**Files:**
- Modify: `apps/openclaw-installer/src/renderer/App.tsx`
- Modify: `apps/openclaw-installer/src/renderer/components/WizardShell.tsx`
- Modify: `apps/openclaw-installer/src/renderer/styles/globals.css`

- [ ] **Step 1: Add explicit visible focus treatment**

Ensure buttons, cards, and inputs can show focus clearly on paper surfaces:

```tsx
style={{
  outlineOffset: 2,
}}
```

And in CSS:

```css
button:focus-visible,
input:focus-visible {
  outline: 2px solid rgba(190, 116, 62, 0.55);
  outline-offset: 3px;
}
```

- [ ] **Step 2: Make selected and disabled states legible without relying only on color**

Keep:

- icon checkmark for selected cards
- stronger border on selected cards
- muted text plus muted background for disabled actions

- [ ] **Step 3: Run full verification**

Run:

```bash
pnpm --filter lobster-installer typecheck
pnpm --filter lobster-installer build:vite
```

Then run locally:

```bash
cd apps/openclaw-installer
pnpm dev
```

Manual acceptance:

- scenario page has one obvious focal action
- background does not draw attention before content
- left rail feels quieter than main content
- final page feels like a deployment handoff

- [ ] **Step 4: Update implementation record**

Append a new section or create a fresh record under:

```text
docs/records/
```

Include:

- what changed visually
- which spec decisions were implemented
- which follow-up polish items remain

---

## Self-Review

### Spec coverage

- background simplification: covered by Task 1
- balanced concierge shell: covered by Task 2
- lower density and stronger primary action: covered by Task 3
- accessibility and state pass: covered by Task 4

### Placeholder scan

- no `TODO`, `TBD`, or undefined follow-ups in implementation steps
- all tasks point to concrete files and concrete commands

### Type consistency

- all work remains inside existing renderer files
- no new function or component names are required for correctness beyond optional local extraction

---

Plan complete and saved to `docs/superpowers/plans/2026-04-13-installer-visual-system-redesign.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
