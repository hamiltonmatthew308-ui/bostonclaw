# Changelog

All notable changes to the Bostonclaw Installer project.

## [0.10.0] - 2026-04-21

### Added
- **Provider dropdown with auto-fill** — replaced hardcoded 2-provider UI with full provider selector: Anthropic, OpenAI, DeepSeek, Moonshot, MiniMax, 智谱 GLM, SiliconFlow, OpenRouter, and Custom. Selecting a provider auto-fills base URL, API type, and default model.
- **`openclaw onboard --non-interactive` integration** — installer now delegates all config writing to OpenClaw's built-in onboard command, eliminating config format mismatches.
- Shared constants file `src/shared/constants.ts` — single source of truth for `NODE_VERSION`, `GATEWAY_PORT`, `OPENCLAW_DIR_NAME`.

### Changed
- **Config writing rewritten** — `writeOpenClawConfig()` removed. Replaced by `runOnboard()` which calls `openclaw onboard --non-interactive --auth-choice <provider>` with the correct flags. This produces config that OpenClaw actually reads (`models.providers` map, `agents.defaults.model.primary`, `gateway.mode: "local"`).
- **`ProviderConfig` type updated** — added `authChoice` (maps to `--auth-choice`), `api` (compatibility mode), `defaultModelRef` (e.g. `anthropic/claude-opus-4-6`). Removed unused fields.
- **`findOpenClawJs` fixed** — searches correct entry points: `openclaw.mjs` and `dist/entry.js` instead of nonexistent `bin/openclaw.js` / `index.js`.
- **`GatewayManager` tray fixed** — entry point search now matches `findOpenClawJs`; `fork()` args corrected to `['gateway', 'run']`; ENV vars corrected (removed fake `OPENCLAW_PORT`/`OPENCLAW_HOST`).
- **Config deep merge** — `writeOpenClawConfig` (now only used for startup/PATH, not provider config) uses deep merge instead of shallow spread to preserve nested fields like `gateway.port`.
- **`system-integration.ts` hardened** — extracted `runPs()` helper with `escapePs()` to prevent PowerShell string injection; plist XML escaping for macOS LaunchAgent commands.
- **`bundle-node.mjs`** — Windows now respects `process.arch` for ARM64 support.
- **`bundle-openclaw.mjs`** — `cleanNodeModules` simplified with `Set` lookups; removed redundant `.d.ts`/`.ts` overlap.
- **`bundle-python.mjs`** — replaced dynamic `await import('node:fs')` with top-level static imports; SHA256 comment now includes verification URL.
- **`hermes.ts` hardened** — PowerShell string injection fixed with `escapePs()`; replaced dynamic `await import('node:child_process')` with top-level `execFileSync` import; pip install from GitHub zip now downloads → extracts → installs from local dir instead of unreliable direct URL install.

### Fixed
- **Critical: config format mismatch** — installer was writing `providers[]` array; OpenClaw reads `models.providers` object map. Configs were silently ignored.
- **Critical: `gateway.mode: "local"` missing** — OpenClaw gateway refuses to start without this field. Now written by `openclaw onboard`.
- **Critical: `findOpenClawJs` paths** — all 3 candidate paths pointed to files that don't exist in the openclaw npm package. Fixed to search `openclaw.mjs` and `dist/entry.js`.
- **Critical: GatewayManager always fails** — tray could never find the gateway entry script; `fork()` was missing `run` subcommand.
- **Hermes: PowerShell injection** — `extractZip` and `extractBundledPython` now escape paths before embedding in PowerShell commands.
- **Hermes: pip install from GitHub zip unreliable** — direct `pip install <url>` fails on nested GitHub zip dirs; now downloads via PowerShell, extracts locally, then installs from the extracted dir.
- Windows ARM64 machines now download the correct Node.js binary.

## [0.9.0] - 2026-04-21

### Added
- **Fully offline installation support** — bundled Node.js, OpenClaw, Python embeddable, Hermes, and FreeClaw into the installer package so corporate users behind firewalls can install without any network access.
- Build scripts for bundling offline resources:
  - `scripts/bundle-node.mjs` — downloads Node.js portable archive for the current platform.
  - `scripts/bundle-openclaw.mjs` — installs `openclaw@latest` with production dependencies and strips dev artifacts.
  - `scripts/bundle-python.mjs` — downloads Python 3.12 embeddable zip and `get-pip.py` for Windows (skips on macOS/Linux).
  - `scripts/bundle-all.mjs` — one-shot runner for all bundles.
- `src/main/utils/system-integration.ts` — utilities for automatic PATH registration (Windows `setx` via PowerShell, macOS `~/.zshrc` / `~/.bash_profile`) and startup item registration (Windows Registry Run key, macOS LaunchAgent).
- UI checkbox in Preflight screen for **"开机自动启动 Gateway"** (OpenClaw path only); startup registration is user-opt-in, not forced.
- Added `registerStartup` flag to `InstallPlan` type and installer store.
- Generated app icons from the Bostonclaw "B" logo (`deploy/favicon.svg`): `icon.ico`, `icon.icns`, `icon.png`, and `tray-icon.png`.
- ESLint configuration (`eslint.config.mjs`) with TypeScript, React Hooks, and Node/Browser globals support.
- `.gitignore` entries for generated bundled resource directories (`resources/node-runtime/`, `resources/openclaw-bundle/`, `resources/python-embed/`).

### Changed
- `src/main/paths/openclaw.ts` — completely rewritten for offline-first installation:
  - Prioritizes extracting bundled Node.js from `resources/node-runtime/`.
  - Prioritizes extracting bundled OpenClaw from `resources/openclaw-bundle/`.
  - Falls back to system Node.js or downloading from nodejs.org only when bundled resources are absent.
  - Automatically registers runtime paths to user PATH after installation.
  - Supports optional startup registration when `plan.registerStartup` is enabled.
  - `writeOpenClawConfig()` now supports merging multiple providers into the config file.
- `src/main/paths/hermes.ts` — updated Windows pip-install path to support bundled Python embeddable:
  - New `extractBundledPython()` helper to extract and configure Python embeddable zip.
  - New `getBundledPythonZip()` and `getBundledGetPip()` helpers.
  - `ensurePython()` now returns the Python executable path and tries bundled Python before winget/python.org download.
  - `verifyAndReturn()` falls back to `pythonExe -m hermes --version` when `hermes` is not on PATH.
- `electron-builder.yml` — `extraResources` filter now includes `node-runtime/`, `openclaw-bundle/`, and `python-embed/`.
- `.github/workflows/build-installer.yml` — updated package filter from `lobster-installer` to `bostonclaw-installer`; added "Bundle offline resources" step before build on both Windows and macOS runners.
- `package.json` — added `bundle:*` scripts and ESLint-related devDependencies.

### Fixed
- Restored `src/main/index.ts` after accidental emptying in commit `f81a4316`.
- Tray Gateway path mismatch — `GatewayManager` now searches the correct installation directory (`~/.bostonclaw-installer/runtime/`) with fallback.
- Added `windowsHide: true` to all `spawn` / `execFile` calls to prevent command-line windows from flashing on Windows.
- Graceful tray icon fallback — tray no longer crashes when icons are missing.
- Fixed various TypeScript strict errors (`any` casts, unused variables, missing imports).

## [0.8.0] - 2026-04-19

### Added
- Initial Bostonclaw Installer rewrite with Electron 40 + React 19 + Vite.
- Multi-path installation wizard: OpenClaw, FreeClaw, Hermes, vendor packages.
- Environment detection (Node.js, Python, Ollama, WSL2, GPU, disk space).
- Deep-link protocol support (`bostonclaw://install`).
- Auto-start Hermes path for zero-click installation.
- Tray application for gateway lifecycle management.
