import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { EnvReport, InstallPlan, InstallProgress, RunResult } from '../../shared/types/installer';
import { detectEnvironment } from '../env/detector';
import { runShellStream } from '../utils/shell-stream';

const HERMES_INSTALL_SH = 'https://hermes-agent.nousresearch.com/install.sh';
const HERMES_ZIP_URL = 'https://github.com/NousResearch/hermes-agent/archive/refs/heads/main.zip';
const PYTHON_WINGET_ID = 'Python.Python.3.12';
// Update this URL when a new Python 3.12.x is released: https://www.python.org/downloads/
const PYTHON_INSTALLER_URL = 'https://www.python.org/ftp/python/3.12.8/python-3.12.8-amd64.exe';

/** Find the bundled hermes-agent.zip — works in dev and packaged Electron */
function getBundledHermesZip(): string | null {
  const candidates = [
    // Packaged: electron-builder copies resources/hermes/ → resources/hermes/
    path.join(process.resourcesPath ?? '', 'resources', 'hermes', 'hermes-agent.zip'),
    // Dev fallback
    path.resolve(__dirname, '..', '..', '..', 'resources', 'hermes', 'hermes-agent.zip'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/** Extract a zip to a temp directory and return the extracted dir path */
async function extractZip(zipPath: string): Promise<string> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-'));
  const { execFileSync } = await import('node:child_process');
  if (process.platform === 'win32') {
    execFileSync('powershell.exe', [
      '-NoProfile', '-Command',
      `Expand-Archive -Path '${zipPath}' -DestinationPath '${tmpDir}' -Force`,
    ], { timeout: 60_000 });
  } else {
    execFileSync('unzip', ['-o', '-q', zipPath, '-d', tmpDir], { timeout: 60_000 });
  }
  // The zip typically extracts to a single top-level dir (hermes-agent-main/)
  const entries = fs.readdirSync(tmpDir);
  if (entries.length === 1 && fs.statSync(path.join(tmpDir, entries[0])).isDirectory()) {
    return path.join(tmpDir, entries[0]);
  }
  return tmpDir;
}

export async function checkEnv(): Promise<EnvReport> {
  return detectEnvironment();
}

export function plan(_env: EnvReport, _opts?: { experimentalWinNative?: boolean }): InstallPlan {
  return {
    steps: [
      { id: 'install', label: '运行 Hermes Agent 安装脚本', estimate: '1-3 min' },
      { id: 'verify', label: '验证安装结果', estimate: '10s' },
    ],
    totalEstimate: '1-3 min',
    warnings: [],
  };
}

// ─── Shared helpers ─────────────────────────────────────────────────

/** Parse "Python 3.12.0" → {major, minor} */
function parsePythonVersion(ver: string | null): { major: number; minor: number } | null {
  if (!ver) return null;
  const m = ver.match(/(\d+)\.(\d+)/);
  if (!m) return null;
  return { major: parseInt(m[1], 10), minor: parseInt(m[2], 10) };
}

function pythonMeetsMinimum(ver: string | null, major: number, minor: number): boolean {
  const p = parsePythonVersion(ver);
  if (!p) return false;
  return p.major > major || (p.major === major && p.minor >= minor);
}

/** Deduplicate the onProgress+logLines callback pattern */
function makeProgressCb(onProgress: (p: InstallProgress) => void, logLines: string[]) {
  return (p: InstallProgress) => {
    const line = p.log.trim();
    if (line) logLines.push(line);
    onProgress(p);
  };
}

function runPowershell(script: string, opts: {
  step: string;
  startPercent: number;
  endPercent: number;
  onProgress: (p: InstallProgress) => void;
}) {
  return runShellStream({
    command: 'powershell.exe',
    args: ['-ExecutionPolicy', 'Bypass', '-NoProfile', '-Command', script],
    ...opts,
  });
}

function verifyHermes(): Promise<{ found: boolean; path: string | null; version: string | null }> {
  return new Promise((resolve) => {
    const which = process.platform === 'win32' ? 'where' : 'which';
    const whichChild = spawn(which, ['hermes'], { shell: false });
    let outPath = '';

    whichChild.stdout?.on('data', (d: Buffer) => { outPath += d.toString(); });
    whichChild.stderr?.on('data', () => {});
    whichChild.on('error', () => resolve({ found: false, path: null, version: null }));
    whichChild.on('close', (code) => {
      if (code !== 0 || !outPath.trim()) {
        resolve({ found: false, path: null, version: null });
        return;
      }
      const foundPath = outPath.split('\n')[0].trim();
      const verChild = spawn('hermes', ['--version'], { shell: false });
      let verOut = '';
      verChild.stdout?.on('data', (d: Buffer) => { verOut += d.toString().trim(); });
      verChild.stderr?.on('data', () => {});
      verChild.on('error', () => resolve({ found: true, path: foundPath, version: null }));
      verChild.on('close', () => resolve({ found: true, path: foundPath, version: verOut || null }));
    });
  });
}

function diagnoseFailure(logText: string): string {
  const t = logText.toLowerCase();

  if (
    t.includes('bash :') ||
    t.includes('commandnotfoundexception') ||
    t.includes('bash: command not found') ||
    t.includes('无法将"bash"项识别为')
  ) {
    return '当前 Windows 环境没有可用的 bash。安装器将自动尝试 Python pip 方式安装。';
  }
  if (t.includes('proxy') || t.includes('tunnel') || t.includes('econnrefused') || t.includes('proxyconnect')) {
    return '网络连接失败，可能是代理或防火墙拦截了请求。请检查网络代理设置后重试。';
  }
  if (t.includes('certificate') || t.includes('ssl') || t.includes('self-signed') || t.includes('cert')) {
    return 'SSL 证书验证失败，可能是企业网络拦截了 HTTPS 流量。请联系 IT 部门或将安装脚本下载到本地执行。';
  }
  if (t.includes('execution policy') || t.includes('running scripts is disabled') || t.includes('cannot be loaded because')) {
    return 'Windows 执行策略禁止了脚本运行。请以管理员身份打开 PowerShell 执行：Set-ExecutionPolicy RemoteSigned -Scope CurrentUser，然后重试。';
  }
  if (t.includes('permission') || t.includes('access denied') || t.includes('eacces') || t.includes('eperm')) {
    return '权限不足。请尝试以管理员身份运行安装器，或检查目标目录的写入权限。';
  }
  if (t.includes('timeout') || t.includes('etimedout') || t.includes('timed out')) {
    return '下载超时，网络可能不稳定。请检查网络连接后重试，或尝试使用镜像源。';
  }
  if (t.includes('curl') && (t.includes('not found') || t.includes('command not found'))) {
    return '系统中未找到 curl 命令。安装器将自动尝试 Python pip 方式安装。';
  }
  if (t.includes('python') && (t.includes('not found') || t.includes('command not found') || t.includes('无法将'))) {
    return 'Python 未安装或不在 PATH 中。请先安装 Python 3.11+：https://www.python.org/downloads/';
  }
  if (t.includes('no module named pip') || t.includes("no module named 'pip'")) {
    return 'Python 已安装但 pip 缺失。请运行 `python -m ensurepip` 后重试。';
  }
  if (t.includes('wsl.exe [argument]') || t.includes('no installed distributions') || t.includes('wsl_e_default_distro_not_found') || t.includes('--distribution')) {
    return '检测到 WSL 仅安装了组件但没有可用 Linux 发行版。安装器将自动尝试 Python pip 方式安装。';
  }
  if (t.includes('build') && (t.includes('failed') || t.includes('error')) && t.includes('wheel')) {
    return 'pip 编译依赖失败，可能缺少 C++ 构建工具。请安装 Visual Studio Build Tools 后重试。';
  }

  return '';
}

// ─── Windows: Python pip install path ───────────────────────────────

async function ensurePython(
  onProgress: (p: InstallProgress) => void,
  logLines: string[],
): Promise<boolean> {
  const pCb = makeProgressCb(onProgress, logLines);

  onProgress({ step: '准备 Python', percent: 10, log: '尝试通过 winget 安装 Python 3.12...' });
  const { code: wgCode } = await runShellStream({
    command: 'winget',
    args: ['install', PYTHON_WINGET_ID, '--accept-package-agreements', '--accept-source-agreements', '--silent'],
    step: '安装 Python 3.12...',
    startPercent: 10,
    endPercent: 22,
    onProgress: pCb,
  });

  if (wgCode === 0) {
    onProgress({ step: 'Python 就绪', percent: 24, log: '✓ Python 3.12 已安装' });
    return true;
  }

  onProgress({ step: '准备 Python', percent: 12, log: 'winget 不可用，从 python.org 下载安装...' });
  const dlScript = [
    `[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12`,
    `Invoke-WebRequest -Uri "${PYTHON_INSTALLER_URL}" -OutFile "$env:TEMP\\python-installer.exe" -UseBasicParsing`,
    'Write-Host "Installing Python (silent)..."',
    'Start-Process -FilePath "$env:TEMP\\python-installer.exe" -ArgumentList "/quiet","InstallAllUsers=0","PrependPath=1","Include_pip=1" -Wait',
    'Remove-Item -Force "$env:TEMP\\python-installer.exe" -ErrorAction SilentlyContinue',
  ].join('; ');

  const { code: dlCode } = await runPowershell(dlScript, {
    step: '下载安装 Python...',
    startPercent: 12,
    endPercent: 22,
    onProgress: pCb,
  });

  if (dlCode === 0) {
    onProgress({ step: 'Python 就绪', percent: 24, log: '✓ Python 3.12 已安装' });
    return true;
  }

  return false;
}

/** Windows: pip install Hermes. Returns 'FALLBACK' to signal bash fallback. */
async function tryPipInstall(
  env: EnvReport,
  onProgress: (p: InstallProgress) => void,
  logLines: string[],
): Promise<RunResult | 'FALLBACK'> {
  const pCb = makeProgressCb(onProgress, logLines);

  const needsPython = !env.python.installed || !pythonMeetsMinimum(env.python.version, 3, 11);
  if (needsPython) {
    const ok = await ensurePython(onProgress, logLines);
    if (!ok) {
      onProgress({ step: 'Python 安装失败', percent: 15, log: 'Python 自动安装失败，尝试 bash 方式...' });
      return 'FALLBACK';
    }
  } else {
    onProgress({ step: '环境检查', percent: 10, log: `✓ Python ${env.python.version} 已就绪` });
  }

  // ─── Strategy 1: local bundled zip (zero network) ───
  const bundledZip = getBundledHermesZip();
  if (bundledZip) {
    onProgress({ step: '安装 Hermes Agent', percent: 25, log: `从本地包安装 (免网络)...` });
    try {
      const srcDir = await extractZip(bundledZip);
      const { code, logs } = await runPowershell(
        [
          '[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12',
          'Write-Host "Installing Hermes Agent from local bundle..."',
          `python -m pip install "${srcDir}" --quiet --disable-pip-version-check`,
        ].join('; '),
        { step: '安装 Hermes Agent...', startPercent: 25, endPercent: 90, onProgress: pCb },
      );
      if (code === 0) {
        return await verifyAndReturn(onProgress, logLines);
      }
      logLines.push(...logs);
      onProgress({ step: '本地安装失败', percent: 25, log: `本地安装退出码 ${code}，尝试网络安装...` });
    } catch (err) {
      onProgress({ step: '本地包异常', percent: 25, log: `本地包解压失败: ${err}，尝试网络安装...` });
    }
  }

  // ─── Strategy 2: pip install from GitHub URL (network) ───
  onProgress({ step: '下载 Hermes Agent', percent: 30, log: '正在从 GitHub 下载安装 Hermes Agent...' });

  const installScript = [
    '[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12',
    'Write-Host "Installing Hermes Agent via pip (network)..."',
    `python -m pip install "${HERMES_ZIP_URL}" --quiet --disable-pip-version-check`,
  ].join('; ');

  const { code, logs } = await runPowershell(installScript, {
    step: '安装 Hermes Agent...',
    startPercent: 30,
    endPercent: 90,
    onProgress: pCb,
  });

  if (code !== 0) {
    const logText = [...logLines, ...logs].join('\n');
    if (/python.*not found|python.*无法将|no module named pip/i.test(logText)) {
      onProgress({ step: 'pip 安装失败', percent: 25, log: 'Python/pip 不可用，尝试 bash 方式...' });
      return 'FALLBACK';
    }
    const diagnosed = diagnoseFailure(logText);
    return {
      success: false,
      message: diagnosed || `pip 安装失败 (退出码 ${code})，请查看下方日志，或尝试重新运行。`,
      nextAction: 'none',
      logs: logLines.slice(-50),
    };
  }

  return await verifyAndReturn(onProgress, logLines);
}

/** Shared verification after successful pip install */
async function verifyAndReturn(
  onProgress: (p: InstallProgress) => void,
  _logLines: string[],
): Promise<RunResult> {
  onProgress({ step: '验证安装', percent: 95, log: '安装完成，正在验证 Hermes 是否可用...' });
  const ver = await verifyHermes();
  if (ver.found) {
    const verInfo = ver.version ? ` — ${ver.version}` : '';
    onProgress({ step: '安装完成', percent: 100, log: `✓ Hermes Agent 安装成功 (${ver.path})${verInfo}` });
    return {
      success: true,
      message: `Hermes Agent 已安装${ver.version ? ` (${ver.version})` : ''}。在终端运行 \`hermes start\` 即可使用。`,
      nextAction: 'show-guide',
      nextUrl: 'https://github.com/NousResearch/hermes-agent#getting-started',
    };
  }

  onProgress({ step: '验证完成', percent: 98, log: '⚠ 安装成功但 hermes 命令未在 PATH 中找到。可能需要重新打开终端。' });
  return {
    success: true,
    message: 'Hermes Agent 已安装，但未检测到 hermes 命令。请重新打开终端后运行 `hermes start`。',
    nextAction: 'show-guide',
    nextUrl: 'https://github.com/NousResearch/hermes-agent#getting-started',
  };
}

// ─── Bash candidate fallback (original logic) ──────────────────────

function runBashCandidates(
  isWin: boolean,
  onProgress: (p: InstallProgress) => void,
  logLines: string[],
): Promise<RunResult> {
  return new Promise((resolve) => {
    const unixInstallCmd = `curl -fsSL ${HERMES_INSTALL_SH} | bash`;
    const candidates = isWin
      ? [
          { command: 'bash', args: ['-lc', unixInstallCmd], hint: 'Git Bash' },
          { command: 'wsl.exe', args: ['--exec', 'bash', '-lc', unixInstallCmd], hint: 'WSL' },
        ]
      : [{ command: 'bash', args: ['-c', unixInstallCmd], hint: 'bash' }];

    const pCb = makeProgressCb(onProgress, logLines);

    const runAttempt = (idx: number): void => {
      const candidate = candidates[idx];
      if (!candidate) {
        resolve({
          success: false,
          message:
            '无法启动 Hermes 安装：Python pip 和 bash 方式均不可用。请安装 Python 3.11+ 或 Git Bash 后重试。',
          nextAction: 'show-guide',
          nextUrl: 'https://hermes-agent.nousresearch.com/',
          logs: logLines.slice(-80),
        });
        return;
      }

      onProgress({
        step: '启动安装脚本',
        percent: 9,
        log: `尝试使用 ${candidate.hint} 执行官方安装命令...`,
      });

      void runShellStream({
        command: candidate.command,
        args: candidate.args,
        step: '安装中...',
        startPercent: 10,
        endPercent: 92,
        onProgress: pCb,
      })
        .then(({ code }) => {
          if (code !== 0) {
            const isCommandNotFound = logLines.some((l) =>
              /not recognized|not found|command not found|is not recognized/i.test(l),
            );
            if (isWin && isCommandNotFound && idx < candidates.length - 1) {
              onProgress({
                step: '启动安装脚本',
                percent: 10,
                log: `${candidate.hint} 不可用，切换下一种方式...`,
              });
              runAttempt(idx + 1);
              return;
            }

            const logText = logLines.join('\n');
            const diagnosed = diagnoseFailure(logText);
            const message = diagnosed
              ? diagnosed
              : `安装脚本退出码 ${code}。请查看下方日志，或尝试重新运行。`;

            resolve({
              success: false,
              message,
              nextAction: 'none',
              logs: logLines.slice(-50),
            });
            return;
          }

          onProgress({ step: '验证安装', percent: 95, log: '脚本完成，正在验证 Hermes 是否可用...' });

          verifyHermes()
            .then((ver) => {
              if (ver.found) {
                const verInfo = ver.version ? ` — ${ver.version}` : '';
                onProgress({ step: '安装完成', percent: 100, log: `✓ Hermes Agent 安装成功 (${ver.path})${verInfo}` });
                resolve({
                  success: true,
                  message: `Hermes Agent 已安装${ver.version ? ` (${ver.version})` : ''}。在终端运行 \`hermes start\` 即可使用。`,
                  nextAction: 'show-guide',
                  nextUrl: 'https://github.com/NousResearch/hermes-agent#getting-started',
                });
              } else {
                onProgress({ step: '验证完成', percent: 98, log: '⚠ 脚本成功，但 hermes 命令未在 PATH 中找到。可能需要重新打开终端。' });
                resolve({
                  success: true,
                  message: '安装脚本已成功执行，但未检测到 hermes 命令。请重新打开终端后运行 `hermes start`。',
                  nextAction: 'show-guide',
                  nextUrl: 'https://github.com/NousResearch/hermes-agent#getting-started',
                });
              }
            })
            .catch((err: Error) => {
              onProgress({ step: '验证完成', percent: 98, log: `⚠ 验证异常: ${err.message}` });
              resolve({
                success: true,
                message: '安装脚本已执行，验证时出现异常。请重新打开终端后运行 `hermes start`。',
                nextAction: 'show-guide',
                nextUrl: 'https://github.com/NousResearch/hermes-agent#getting-started',
              });
            });
        })
        .catch((err) => {
          const mayRetry = isWin && idx < candidates.length - 1;
          if (mayRetry) {
            onProgress({
              step: '启动安装脚本',
              percent: 10,
              log: `${candidate.hint} 启动失败 (${err.message})，切换下一种方式...`,
            });
            runAttempt(idx + 1);
            return;
          }
          resolve({
            success: false,
            message: `无法启动安装脚本: ${err.message}`,
            nextAction: 'none',
            logs: logLines,
          });
        });
    };

    runAttempt(0);
  });
}

// ─── Main entry ─────────────────────────────────────────────────────

export async function run(_plan: InstallPlan, onProgress: (p: InstallProgress) => void): Promise<RunResult> {
  const isWin = process.platform === 'win32';
  const logLines: string[] = [];

  onProgress({ step: '检测环境', percent: 5, log: '检查 Hermes Agent 安装状态...' });

  // Fast path: already installed
  const existing = await verifyHermes();
  if (existing.found) {
    const verInfo = existing.version ? ` (${existing.version})` : '';
    onProgress({ step: '已完成', percent: 100, log: `✓ Hermes Agent 已安装 ${existing.path}${verInfo}` });
    return {
      success: true,
      message: `Hermes Agent 已安装${verInfo}。在终端运行 \`hermes start\` 即可使用。`,
      nextAction: 'show-guide',
      nextUrl: 'https://github.com/NousResearch/hermes-agent#getting-started',
    };
  }

  onProgress({ step: '启动安装', percent: 8, log: 'Hermes Agent 未安装，开始自动安装...' });

  if (isWin) {
    try {
      const env = await detectEnvironment();
      const result = await tryPipInstall(env, onProgress, logLines);
      if (result !== 'FALLBACK') return result;
    } catch (err) {
      logLines.push(`Python pip 路径异常: ${String(err)}`);
    }
  }

  return runBashCandidates(isWin, onProgress, logLines);
}
