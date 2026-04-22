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
import { spawn } from 'node:child_process';
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

function runNpmInstall(tmpDir, attempt) {
  return new Promise((resolve, reject) => {
    console.log(`[bundle-openclaw] npm install attempt ${attempt}...`);
    const child = spawn('npm', [
      'install',
      `openclaw@${OPENCLAW_VERSION}`,
      '--production',
      '--no-package-lock',
      '--prefix',
      tmpDir,
    ], {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      windowsHide: true,
    });

    const timer = setTimeout(() => {
      console.error('[bundle-openclaw] npm install timed out after 10 minutes, killing...');
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 5000);
    }, 600_000);

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`npm install exited with code ${code}`));
      }
    });
  });
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function main() {
  if (existsSync(RESOURCES_DIR)) {
    console.log('[bundle-openclaw] Cleaning existing bundle...');
    rmSync(RESOURCES_DIR, { recursive: true, force: true });
  }
  mkdirSync(RESOURCES_DIR, { recursive: true });

  const tmpDir = mkdtempSync(join(tmpdir(), 'openclaw-bundle-'));
  console.log(`[bundle-openclaw] Installing openclaw@${OPENCLAW_VERSION} into ${tmpDir}...`);

  const MAX_RETRIES = 3;
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await runNpmInstall(tmpDir, attempt);
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err;
      console.error(`[bundle-openclaw] Attempt ${attempt} failed:`, err.message);
      if (attempt < MAX_RETRIES) {
        console.log('[bundle-openclaw] Retrying in 10s...');
        await sleep(10_000);
      }
    }
  }
  if (lastErr) {
    console.error('[bundle-openclaw] npm install failed after all retries');
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
