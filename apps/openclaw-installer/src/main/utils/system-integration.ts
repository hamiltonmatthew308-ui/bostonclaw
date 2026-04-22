import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { readFile, writeFile, appendFile, mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const execFileAsync = promisify(execFile);

/* ------------------------------------------------------------------ */
/*  PowerShell helper                                                  */
/* ------------------------------------------------------------------ */

function escapePs(s: string): string {
  // Escape characters that have special meaning inside PowerShell double-quoted strings
  return s.replace(/(["'$`\\])/g, '`$1');
}

async function runPs(script: string): Promise<string> {
  const { stdout } = await execFileAsync('powershell.exe', [
    '-NoProfile', '-Command', script,
  ], { windowsHide: true });
  return stdout.trim();
}

/* ------------------------------------------------------------------ */
/*  PATH registration                                                  */
/* ------------------------------------------------------------------ */

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}

export async function registerWindowsPath(newPath: string): Promise<boolean> {
  const current = await runPs('[Environment]::GetEnvironmentVariable("Path", "User")');
  const normalizedNew = normalizePath(newPath);
  const parts = current.split(';').map((p) => normalizePath(p.trim())).filter(Boolean);

  if (parts.includes(normalizedNew)) return false;

  const updated = [...parts, normalizedNew].join(';');
  await runPs(`[Environment]::SetEnvironmentVariable("Path", "${escapePs(updated)}", "User")`);
  return true;
}

export async function registerMacPath(newPath: string): Promise<boolean> {
  const shell = process.env.SHELL?.includes('bash') ? '.bash_profile' : '.zshrc';
  const rcPath = join(homedir(), shell);
  const line = `export PATH="${newPath}:$PATH"`;

  if (existsSync(rcPath)) {
    const content = await readFile(rcPath, 'utf-8');
    if (content.includes(newPath)) return false;
  }

  await appendFile(rcPath, `\n# Bostonclaw PATH\n${line}\n`, 'utf-8');
  return true;
}

/* ------------------------------------------------------------------ */
/*  Startup registration                                               */
/* ------------------------------------------------------------------ */

export async function registerWindowsStartup(name: string, command: string): Promise<void> {
  await runPs(
    `Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" ` +
    `-Name "${escapePs(name)}" -Value "${escapePs(command)}"`,
  );
}

export async function unregisterWindowsStartup(name: string): Promise<void> {
  await runPs(
    `Remove-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" ` +
    `-Name "${escapePs(name)}" -ErrorAction SilentlyContinue`,
  );
}

export async function registerMacStartup(name: string, command: string): Promise<void> {
  const plistDir = join(homedir(), 'Library', 'LaunchAgents');
  await mkdir(plistDir, { recursive: true });
  const plistPath = join(plistDir, `${name}.plist`);

  // Escape XML-special characters in command for plist
  const escapedCmd = command
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

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
    <string>${escapedCmd}</string>
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
