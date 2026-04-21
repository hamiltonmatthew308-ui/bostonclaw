import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { readFile, writeFile, appendFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const execFileAsync = promisify(execFile);

/* ------------------------------------------------------------------ */
/*  PATH helpers                                                       */
/* ------------------------------------------------------------------ */

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}

async function getWindowsPath(): Promise<string> {
  const { stdout } = await execFileAsync('powershell.exe', [
    '-NoProfile',
    '-Command',
    '[Environment]::GetEnvironmentVariable("Path", "User")',
  ], { windowsHide: true });
  return stdout.trim();
}

export async function registerWindowsPath(newPath: string): Promise<boolean> {
  const current = await getWindowsPath();
  const normalizedNew = normalizePath(newPath);
  const parts = current.split(';').map((p) => normalizePath(p.trim())).filter(Boolean);

  if (parts.includes(normalizedNew)) {
    return false; // already present
  }

  const updated = [...parts, normalizedNew].join(';');
  await execFileAsync('powershell.exe', [
    '-NoProfile',
    '-Command',
    `[Environment]::SetEnvironmentVariable("Path", "${updated}", "User")`,
  ], { windowsHide: true });

  return true;
}

export async function registerMacPath(newPath: string): Promise<boolean> {
  const shell = process.env.SHELL?.includes('bash') ? '.bash_profile' : '.zshrc';
  const rcPath = join(homedir(), shell);

  const line = `export PATH="${newPath}:$PATH"`;

  let content = '';
  if (existsSync(rcPath)) {
    content = await readFile(rcPath, 'utf-8');
  }

  if (content.includes(newPath)) {
    return false;
  }

  await appendFile(rcPath, `\n# Bostonclaw PATH\n${line}\n`, 'utf-8');
  return true;
}

/* ------------------------------------------------------------------ */
/*  Startup helpers                                                    */
/* ------------------------------------------------------------------ */

export async function registerWindowsStartup(name: string, command: string): Promise<void> {
  await execFileAsync('powershell.exe', [
    '-NoProfile',
    '-Command',
    `Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "${name}" -Value "${command}"`,
  ], { windowsHide: true });
}

export async function unregisterWindowsStartup(name: string): Promise<void> {
  await execFileAsync('powershell.exe', [
    '-NoProfile',
    '-Command',
    `Remove-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "${name}" -ErrorAction SilentlyContinue`,
  ], { windowsHide: true });
}

export async function registerMacStartup(name: string, command: string): Promise<void> {
  const plistDir = join(homedir(), 'Library', 'LaunchAgents');
  const plistPath = join(plistDir, `${name}.plist`);

  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${name}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/sh</string>
    <string>-c</string>
    <string>${command}</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <false/>
</dict>
</plist>`;

  await writeFile(plistPath, plist, 'utf-8');
  await execFileAsync('launchctl', ['load', plistPath]).catch(() => {});
}

export async function unregisterMacStartup(name: string): Promise<void> {
  const plistPath = join(homedir(), 'Library', 'LaunchAgents', `${name}.plist`);
  await execFileAsync('launchctl', ['unload', plistPath]).catch(() => {});
}
