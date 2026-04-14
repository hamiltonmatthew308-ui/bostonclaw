# Lobster Installer Visual System Redesign

- Date: 2026-04-13
- Scope: `apps/openclaw-installer/src/renderer`
- Status: Draft approved in conversation, written for review before implementation

## 1. Goal

Redesign the Lobster installer visual system so it feels like a capable installation concierge rather than:

- a generic Electron dashboard
- a marketing page
- a dense enterprise control panel

The redesign must specifically fix the two user-reported problems:

1. the current visual treatment relies too heavily on awkward background gradients
2. the interface is still too dense, even after the previous color refresh

## 2. Product Intent

The installer is not a showcase surface. Its job is to reduce technical decision-making for the user.

The UI should therefore communicate:

- "I understand your path"
- "I can recommend the right runtime and deployment route"
- "You only need to focus on one action at a time"

The tone should be warm, competent, and calm.

## 3. Chosen Design Direction

The approved direction is:

- Layout family: `B2. Balanced Concierge`
- Color direction: `Copper Editorial`

This means:

- left rail remains, but with lower visual dominance
- main content area leads with a single conclusion
- each step screen centers around one primary task block
- only one secondary supporting block is shown beside or below the main task
- the background becomes quiet and structural, not decorative

## 4. Visual System

### 4.1 Core aesthetic

The visual style should feel like a refined installation desk:

- warm paper surfaces
- copper-orange accents
- deep brown typography
- restrained shadows
- minimal visible gradients

The memorable quality should come from composition, typography, and calm confidence, not from special effects.

### 4.2 Color tokens

Use a compact token system with clear purpose.

- `bg.app`: warm paper background
- `bg.panel`: slightly lighter paper card surface
- `bg.subtle`: muted surface for secondary panels
- `text.primary`: dark brown for headings and critical text
- `text.secondary`: warm muted brown for explanation text
- `text.tertiary`: low-emphasis labels and metadata
- `accent.primary`: copper-orange for selected state and primary CTAs
- `accent.soft`: pale copper tint for recommendation banners
- `border.default`: low-contrast warm border
- `state.success`: muted green, only for success confirmation
- `state.warn`: muted amber, only for caution/status
- `state.error`: restrained terracotta, only for failure

Rules:

- remove dramatic radial gradients from the main frame
- allow only very soft tonal variation in the app background
- keep orange concentrated in actions, badges, and active step markers

### 4.3 Typography

Use typography to create hierarchy instead of adding more cards.

- Display/headings: serif or editorial-feeling title stack
- Body/UI labels: clean sans stack
- Code, paths, install codes: monospace

Type behavior:

- page title should be noticeably larger and slower than UI labels
- recommendation statement should read like a conclusion, not helper copy
- body text should stay compact and readable, never airy marketing copy

### 4.4 Spacing and shape

Adopt a more restrained spacing system:

- tighter global rhythm than a landing page
- looser rhythm than a dashboard
- fewer nested containers
- slightly larger radius on major blocks
- smaller radius on utility/status surfaces

Target effect:

- fewer things on screen
- clearer breathing room around the primary action
- less visual interruption from borders and decorative treatments

## 5. Layout System

### 5.1 Global frame

The installer keeps a two-column frame:

- left rail: progress, step labels, small current summary
- right content: conclusion-led workspace

But the balance changes:

- left rail becomes quieter and narrower in perceived weight
- right panel becomes the obvious focal area

### 5.2 Left rail

Purpose:

- orientation
- progress
- minimal state summary

Rules:

- one compact brand block
- one concise progress indicator
- one active-step stack
- one small recommendation summary block

Do not use the left rail for:

- long descriptions
- duplicate explanatory text
- multiple promotional cards

### 5.3 Right workspace

Every step page follows the same hierarchy:

1. large page conclusion
2. recommendation strip
3. primary task block
4. one secondary support block
5. next/previous action bar

This hierarchy is the main mechanism for reducing density.

### 5.4 Primary vs secondary blocks

Primary block examples:

- scenario selection cards
- runtime selection cards
- install code import
- final import action

Secondary block examples:

- environment summary
- implementation note
- cost note
- file output summary

Constraint:

- never show more than one primary block cluster and one secondary block cluster above the fold

## 6. Step-by-Step UX Structure

### 6.1 Scenario

Focus:

- one clear recommendation
- one grid of scenario choices
- one compact environment/status companion block

Change from current version:

- install code import should visually merge into the main task area rather than appear as just another equal panel

### 6.2 Runtime

Focus:

- runtime cards as the single primary choice area
- one support block explaining current recommendation and implementation impact

Reduce:

- excess explanatory duplication between section intro, banner, and panels

### 6.3 Template

Focus:

- template cards as the hero task
- one compact explanation of what a template pack contains

Reduce:

- repeated product-strategy language on the same screen

### 6.4 Deployment

Focus:

- deployment choice cards
- one support block for cost framing

Reduce:

- too many equal-weight explanatory boxes

### 6.5 Plan / Result

This page should feel like a handoff and confirmation page, not a status dump.

Structure:

1. chosen route summary
2. primary import action
3. success/failure block
4. next-stage implementation notes

The success state should feel like:

- the AI colleague is now placed locally
- here is where it lives
- here is what was written

Not:

- a generic console result panel

## 7. Component-Level Changes

### 7.1 `WizardShell`

Change responsibilities:

- stronger frame composition
- quieter sidebar visuals
- less decorative surface treatment
- clearer headline area on the right

### 7.2 `SectionIntro`

Must become:

- one strong editorial title
- one short explanatory paragraph

Must stop behaving like:

- a repeated mini-hero on every screen

### 7.3 `RecommendationBanner`

Should become a compact decision strip:

- short conclusion
- one supporting sentence

Not a full card competing with the primary task.

### 7.4 `ChoiceCard`

Should shift from "dashboard option card" to "selection sheet":

- less contrast
- lighter surfaces
- better text hierarchy
- clearer selected state

### 7.5 `InfoPanel`

Should be demoted:

- smaller heading
- less contrast than the main task block
- visually supportive, not competitive

### 7.6 Install code input

Needs a stronger role in the flow:

- clearer label
- more integrated with the primary path
- calmer field styling
- stronger primary button relationship

## 8. States and Accessibility

The redesign must explicitly cover:

- empty state
- loading state
- success state
- error state
- keyboard focus visibility
- contrast on selected and disabled controls

Requirements:

- focus ring must remain visible on paper-toned surfaces
- selected cards must be distinguishable without relying only on color
- status colors should be reinforced by iconography or text label

## 9. Implementation Scope

Primary files:

- `apps/openclaw-installer/src/renderer/App.tsx`
- `apps/openclaw-installer/src/renderer/components/WizardShell.tsx`
- `apps/openclaw-installer/src/renderer/styles/globals.css`

Expected work:

- replace the current global color tokens
- simplify background treatment
- rebalance layout hierarchy
- reduce per-step visible block count
- refine typography and button hierarchy
- restyle states consistently

## 10. Acceptance Criteria

The redesign is successful if all of the following are true:

1. The interface no longer reads as a generic Electron dashboard.
2. The background no longer attracts attention away from the content.
3. On each step, users can identify the single primary action within two seconds.
4. The left rail supports orientation without competing with the main workspace.
5. The final import screen feels like a deployment handoff, not a log output.
6. Visual density is reduced without removing core functionality.

## 11. Out of Scope

This redesign does not include:

- new runtime logic
- deeper install automation
- web template center redesign
- new animation system
- large-scale component extraction beyond what supports the visual rewrite

## 12. Risks

### Risk 1: Over-correcting into a marketing layout

Mitigation:

- keep interaction density appropriate for a real tool
- preserve explicit status, progress, and action controls

### Risk 2: Making the interface too sparse

Mitigation:

- keep one support block visible on every step
- do not remove essential implementation information

### Risk 3: Decorative paper styling becoming gimmicky

Mitigation:

- use texture and tonal variation very lightly
- rely on hierarchy, not ornament

## 13. Recommended Next Step

After review, the next step should be to write an implementation plan that breaks this redesign into:

1. token and background rewrite
2. shell layout rewrite
3. per-step hierarchy cleanup
4. state and accessibility pass
