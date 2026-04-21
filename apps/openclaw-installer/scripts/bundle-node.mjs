#!/usr/bin/env node
/**
 * Bundle standalone Node.js runtime into resources/node-runtime/
 * Downloads the official Node.js portable archive for the current platform.
 */
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { get } from 'node:https';
import { join, basename } from 'node:path';
import { pipeline } from 'node:stream/promises';

const VERSION = 'v22.14.0';
const RESOURCES_DIR = join(process.cwd(), 'resources', 'node-runtime');

function getTarget() {
  const platform = process.platform;
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64';

  if (platform === 'darwin') {
    return { filename: `node-${VERSION}-darwin-${arch}.tar.xz`, ext: 'tar.xz' };
  }
  if (platform === 'linux') {
    return { filename: `node-${VERSION}-linux-${arch}.tar.xz`, ext: 'tar.xz' };
  }
  return { filename: `node-${VERSION}-win-x64.zip`, ext: 'zip' };
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`[bundle-node] Downloading ${basename(url)}...`);
    const file = createWriteStream(dest);
    get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        download(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        return;
      }
      pipeline(response, file).then(() => resolve()).catch(reject);
    }).on('error', reject);
  });
}

async function main() {
  mkdirSync(RESOURCES_DIR, { recursive: true });

  const { filename } = getTarget();
  const url = `https://nodejs.org/dist/${VERSION}/${filename}`;
  const dest = join(RESOURCES_DIR, filename);

  if (existsSync(dest)) {
    console.log(`[bundle-node] Already exists: ${dest}`);
    return;
  }

  await download(url, dest);
  console.log(`[bundle-node] Saved to ${dest}`);
}

main().catch((err) => {
  console.error('[bundle-node] Failed:', err.message);
  process.exit(1);
});
