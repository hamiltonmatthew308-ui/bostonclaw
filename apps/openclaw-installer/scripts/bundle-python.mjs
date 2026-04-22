#!/usr/bin/env node
/**
 * Download Python embeddable zip for Windows into resources/python-embed/
 * macOS / Linux: skip (system Python or Homebrew is acceptable)
 *
 * Python 3.12.9 embeddable x64 is ~25 MB zipped.
 */
import { existsSync, mkdirSync, createWriteStream, rmSync, statSync, createReadStream } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const RESOURCES_DIR = join(process.cwd(), 'resources', 'python-embed');
const PYTHON_VERSION = '3.12.9';
const FILENAME = `python-${PYTHON_VERSION}-embed-amd64.zip`;
const URL = `https://www.python.org/ftp/python/${PYTHON_VERSION}/${FILENAME}`;
// SHA256 for the exact version above. Update both when bumping PYTHON_VERSION.
// Verify: https://www.python.org/downloads/release/python-3129/ → "Files" → SHA256
const SHA256 = '615861fb801e8b04c847598db4e1e46e4b046295017caa37cb5486dde72b5865';

function getFileSizeMB(filePath) {
  try {
    const { size } = statSync(filePath);
    return (size / 1024 / 1024).toFixed(1);
  } catch {
    return '0';
  }
}

async function downloadFile(url, dest) {
  console.log(`[bundle-python] Downloading ${url}...`);
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok || !response.body) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const fileStream = createWriteStream(dest);
  await pipeline(Readable.fromWeb(response.body), fileStream);
  console.log(`[bundle-python] Saved to ${dest}`);
}

async function verifySha256(filePath, expected) {
  const hash = createHash('sha256');
  const stream = createReadStream(filePath);
  for await (const chunk of stream) hash.update(chunk);
  const actual = hash.digest('hex');
  if (actual.toLowerCase() !== expected.toLowerCase()) {
    throw new Error(`SHA256 mismatch! Expected ${expected}, got ${actual}`);
  }
  console.log('[bundle-python] SHA256 verified.');
}

async function main() {
  if (process.platform !== 'win32') {
    console.log('[bundle-python] Skipping on non-Windows platform.');
    return;
  }

  if (existsSync(RESOURCES_DIR)) {
    console.log('[bundle-python] Cleaning existing bundle...');
    rmSync(RESOURCES_DIR, { recursive: true, force: true });
  }
  mkdirSync(RESOURCES_DIR, { recursive: true });

  const destPath = join(RESOURCES_DIR, FILENAME);

  try {
    await downloadFile(URL, destPath);
    await verifySha256(destPath, SHA256);
    const size = getFileSizeMB(destPath);
    console.log(`[bundle-python] Done. Size: ${size} MB`);
  } catch (err) {
    console.error('[bundle-python] Failed:', err.message);
    process.exit(1);
  }

  // Also bundle get-pip.py for offline pip installation
  const getPipPath = join(RESOURCES_DIR, 'get-pip.py');
  try {
    if (!existsSync(getPipPath)) {
      await downloadFile('https://bootstrap.pypa.io/get-pip.py', getPipPath);
      const pipSize = getFileSizeMB(getPipPath);
      console.log(`[bundle-python] get-pip.py downloaded. Size: ${pipSize} MB`);
    }
  } catch (err) {
    console.warn('[bundle-python] get-pip.py download failed (optional):', err.message);
  }
}

main().catch((err) => {
  console.error('[bundle-python] Failed:', err.message);
  process.exit(1);
});
