#!/usr/bin/env node
/**
 * Bundle OpenClaw npm package + dependencies into resources/openclaw-bundle/
 * Runs npm install on the CURRENT platform so native addons (sharp, sqlite-vec)
 * download the correct prebuilt binaries.
 *
 * Must be run separately on Windows and macOS CI runners.
 */
import { existsSync, mkdirSync, cpSync, rmSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const RESOURCES_DIR = join(process.cwd(), 'resources', 'openclaw-bundle');
const OPENCLAW_VERSION = 'latest';

const STRIP_DIRS = new Set(['test', 'tests', '__tests__', 'docs', 'doc', 'examples', 'demo', '.github', '.git']);
const STRIP_EXTS = new Set(['.ts', '.map', '.md']);

function cleanNodeModules(dir) {
  const items = readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = join(dir, item.name);
    if (item.isDirectory()) {
      if (STRIP_DIRS.has(item.name)) {
        rmSync(fullPath, { recursive: true, force: true });
        continue;
      }
      cleanNodeModules(fullPath);
    } else if (item.isFile()) {
      const ext = item.name.substring(item.name.lastIndexOf('.'));
      if (STRIP_EXTS.has(ext) || (item.name.startsWith('.') && item.name !== '.bin')) {
        unlinkSync(fullPath);
      }
    }
  }
}

async function main() {
  if (existsSync(RESOURCES_DIR)) {
    console.log('[bundle-openclaw] Cleaning existing bundle...');
    rmSync(RESOURCES_DIR, { recursive: true, force: true });
  }
  mkdirSync(RESOURCES_DIR, { recursive: true });

  const tmpDir = mkdtempSync(join(tmpdir(), 'openclaw-bundle-'));
  console.log(`[bundle-openclaw] Installing openclaw@${OPENCLAW_VERSION} into ${tmpDir}...`);

  try {
    execSync(`npm install openclaw@${OPENCLAW_VERSION} --production --no-package-lock --prefix ${tmpDir}`, {
      stdio: 'inherit',
      timeout: 300_000,
    });
  } catch (err) {
    console.error('[bundle-openclaw] npm install failed:', err.message);
    process.exit(1);
  }

  const nodeModulesSrc = join(tmpDir, 'node_modules');
  if (!existsSync(nodeModulesSrc)) {
    console.error('[bundle-openclaw] node_modules not found after install');
    process.exit(1);
  }

  console.log('[bundle-openclaw] Cleaning unnecessary files...');
  cleanNodeModules(nodeModulesSrc);

  console.log(`[bundle-openclaw] Copying to ${RESOURCES_DIR}...`);
  cpSync(nodeModulesSrc, RESOURCES_DIR, { recursive: true, force: true });

  rmSync(tmpDir, { recursive: true, force: true });

  const stats = readdirSync(RESOURCES_DIR).length;
  console.log(`[bundle-openclaw] Done. ${stats} top-level packages copied.`);
}

main().catch((err) => {
  console.error('[bundle-openclaw] Failed:', err.message);
  process.exit(1);
});
