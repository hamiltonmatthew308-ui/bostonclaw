# Changelog

All notable changes to the Bostonclaw Installer project.

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
