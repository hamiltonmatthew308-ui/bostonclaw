import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import os from 'node:os';

import type { EnvReport } from '../../shared/types/installer';

const execFileAsync = promisify(execFile);

async function which(cmd: string): Promise<string | null> {
  try {
    if (process.platform === 'win32') {
      const { stdout } = await execFileAsync('where', [cmd], { windowsHide: true });
      const hit = stdout.split(/\r?\n/).map((x) => x.trim()).filter(Boolean)[0];
      return hit || null;
    }
    const { stdout } = await execFileAsync('which', [cmd]);
    const hit = stdout.trim();
    return hit ? hit : null;
  } catch {
    return null;
  }
}

async function cmdVersion(cmd: string, args: string[] = ['--version']): Promise<string | null> {
  try {
    const { stdout, stderr } = await execFileAsync(cmd, args, { windowsHide: true });
    const out = (stdout || stderr || '').trim();
    if (!out) return null;
    return out.split(/\r?\n/)[0].trim();
  } catch {
    return null;
  }
}

async function diskFreeGB(): Promise<number> {
  // Best-effort only. We want deterministic, non-throwing behavior for the UI.
  try {
    if (process.platform === 'win32') {
      const { stdout } = await execFileAsync(
        'powershell',
        [
          '-NoProfile',
          '-Command',
          "(Get-PSDrive -Name C).Free/1GB",
        ],
        { windowsHide: true },
      );
      const n = Number(String(stdout).trim());
      if (Number.isFinite(n) && n >= 0) return n;
      return 0;
    }

    const { stdout } = await execFileAsync('df', ['-k', os.homedir()]);
    const lines = stdout.trim().split(/\r?\n/);
    if (lines.length < 2) return 0;
    const parts = lines[lines.length - 1].trim().split(/\s+/);
    // df -k: ... Available(KB) ... is typically 4th column from end, but varies.
    // We'll take the second-to-last numeric-looking token.
    const nums = parts.map((p) => Number(p)).filter((n) => Number.isFinite(n));
    const availableKB = nums.length >= 2 ? nums[nums.length - 2] : 0;
    return availableKB / 1024 / 1024;
  } catch {
    return 0;
  }
}

async function detectWSL2(): Promise<boolean | undefined> {
  if (process.platform !== 'win32') return undefined;
  try {
    // Prefer a structured parse of `wsl.exe -l -v` output.
    // Typical output:
    //   NAME      STATE           VERSION
    // * Ubuntu    Running         2
    const { stdout } = await execFileAsync('wsl.exe', ['-l', '-v'], { windowsHide: true, timeout: 8000 });
    const lines = String(stdout)
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    for (const line of lines) {
      if (/^NAME\s+/i.test(line)) continue;
      const cleaned = line.replace(/^\*\s*/, '').trim();
      const parts = cleaned.split(/\s+/);
      const maybeVersion = parts[parts.length - 1];
      if (maybeVersion === '2') return true;
    }
    return false;
  } catch {
    // Fallback: `wsl.exe --status` exists on newer Windows and returns "Default Version: 2".
    try {
      const { stdout } = await execFileAsync('wsl.exe', ['--status'], { windowsHide: true, timeout: 8000 });
      return /Default Version:\s*2/i.test(String(stdout));
    } catch {
      return false;
    }
  }
}

export async function detectEnvironment(): Promise<EnvReport> {
  const platform: EnvReport['os']['platform'] =
    process.platform === 'darwin' ? 'mac' : process.platform === 'win32' ? 'win' : 'linux';

  const nodePath = await which('node');
  const pythonPath = (await which('python3')) ?? (await which('python'));
  const ollamaPath = await which('ollama');

  const [nodeVer, pyVer, ollamaVer, freeGB, wsl2] = await Promise.all([
    nodePath ? cmdVersion(nodePath, ['--version']) : Promise.resolve(null),
    pythonPath ? cmdVersion(pythonPath, ['--version']) : Promise.resolve(null),
    ollamaPath ? cmdVersion(ollamaPath, ['--version']) : Promise.resolve(null),
    diskFreeGB(),
    detectWSL2(),
  ]);

  return {
    os: { platform, arch: process.arch, version: os.release() },
    nodejs: { installed: Boolean(nodePath), version: nodeVer, path: nodePath },
    python: { installed: Boolean(pythonPath), version: pyVer },
    ollama: { installed: Boolean(ollamaPath), version: ollamaVer },
    diskFreeGB: freeGB,
    wsl2,
  };
}
