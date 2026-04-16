import { app, shell } from 'electron';
import { existsSync } from 'node:fs';
import { mkdir, copyFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { EnvReport, InstallPlan, InstallProgress, RunResult } from '../../shared/types/installer';
import { detectEnvironment } from '../env/detector';

const FREECLAW_DOWNLOAD_URL = 'https://github.com/wangdali-dev/FreeClaw/releases/latest';

function getUserDataPath(): string {
  try {
    return app.getPath('userData');
  } catch {
    return join(homedir(), '.bostonclaw-installer');
  }
}

function getBundledFreeClawDir(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'resources', 'freeclaw')
    : join(__dirname, '../../../resources/freeclaw');
}

function getExtractedFreeClawDir(): string {
  return join(getUserDataPath(), 'bundles', 'freeclaw');
}

async function readVersionTxt(dir: string): Promise<string | null> {
  try {
    return await readFile(join(dir, 'VERSION.txt'), 'utf-8');
  } catch {
    return null;
  }
}

async function detectExistingFreeClaw(): Promise<{ path: string; version: string | null } | null> {
  const extractedDir = getExtractedFreeClawDir();
  const extractedExe = join(extractedDir, 'FreeClawLauncher.exe');
  if (existsSync(extractedExe)) {
    return { path: extractedExe, version: await readVersionTxt(extractedDir) };
  }
  return null;
}

async function detectExistingBostonclaw(): Promise<string[]> {
  const hits: string[] = [];
  const checks: string[] = [];

  if (process.platform === 'win32') {
    // Common Windows install locations
    const localAppData = process.env.LOCALAPPDATA;
    const programFiles = process.env.PROGRAMFILES;
    const programFilesX86 = process.env['PROGRAMFILES(X86)'];
    if (localAppData) checks.push(join(localAppData, 'Programs', 'Bostonclaw'));
    if (programFiles) checks.push(join(programFiles, 'Bostonclaw'));
    if (programFilesX86) checks.push(join(programFilesX86, 'Bostonclaw'));
  } else if (process.platform === 'darwin') {
    checks.push('/Applications/Bostonclaw.app');
    checks.push('/Applications/Lobster.app');
    checks.push(join(homedir(), 'Applications', 'Bostonclaw.app'));
    checks.push(join(homedir(), 'Applications', 'Lobster.app'));
  } else {
    checks.push(join(homedir(), '.local', 'share', 'bostonclaw'));
    checks.push(join(homedir(), '.local', 'share', 'lobster'));
  }

  for (const p of checks) {
    if (existsSync(p)) hits.push(p);
  }

  return hits;
}

async function extractBundledFreeClaw(onProgress: (p: InstallProgress) => void): Promise<string> {
  const bundledDir = getBundledFreeClawDir();
  const targetDir = getExtractedFreeClawDir();
  const bundledExe = join(bundledDir, 'FreeClawLauncher.exe');

  if (!existsSync(bundledExe)) {
    throw new Error('未找到内置的 FreeClaw 安装器，请检查安装包完整性。');
  }

  onProgress({ step: '释放 FreeClaw', percent: 10, log: `创建目录: ${targetDir}` });
  await mkdir(targetDir, { recursive: true });

  onProgress({ step: '释放 FreeClaw', percent: 20, log: `复制 FreeClawLauncher.exe...` });
  const targetExe = join(targetDir, 'FreeClawLauncher.exe');
  await copyFile(bundledExe, targetExe);

  const licenseSrc = join(bundledDir, 'LICENSE-FreeClaw.txt');
  if (existsSync(licenseSrc)) {
    onProgress({ step: '释放 FreeClaw', percent: 25, log: '复制 LICENSE-FreeClaw.txt...' });
    await copyFile(licenseSrc, join(targetDir, 'LICENSE-FreeClaw.txt'));
  }

  const versionSrc = join(bundledDir, 'VERSION.txt');
  if (existsSync(versionSrc)) {
    onProgress({ step: '释放 FreeClaw', percent: 30, log: '复制 VERSION.txt...' });
    await copyFile(versionSrc, join(targetDir, 'VERSION.txt'));
  }

  onProgress({ step: '释放 FreeClaw', percent: 35, log: `释放完成: ${targetExe}` });
  return targetExe;
}

export async function checkEnv(): Promise<EnvReport> {
  return detectEnvironment();
}

export function plan(env: EnvReport, _opts?: { experimentalWinNative?: boolean }): InstallPlan {
  const warnings: string[] = [];
  const isWin = env.os.platform === 'win';

  if (!isWin) {
    warnings.push('FreeClaw 一键安装仅支持 Windows。macOS/Linux 用户可跳转到下载页获取其他方案。');
  }
  if (env.diskFreeGB > 0 && env.diskFreeGB < 10) {
    warnings.push('可用磁盘空间偏少，本地模型通常需要 10GB+ 空间。');
  }

  return {
    steps: isWin
      ? [
          { id: 'extract', label: '释放内置 FreeClaw 启动器', estimate: '< 1 min' },
          { id: 'launch', label: '启动 FreeClaw 并按向导安装', estimate: '5-20 min' },
        ]
      : [
          { id: 'guide', label: '打开 FreeClaw 下载页', estimate: '< 1 min' },
          { id: 'install', label: '下载并手动安装', estimate: '5-20 min' },
        ],
    totalEstimate: '5-20 min',
    warnings,
  };
}

export async function run(_plan: InstallPlan, onProgress: (p: InstallProgress) => void): Promise<RunResult> {
  const logs: string[] = [];
  const pushLog = (msg: string) => {
    logs.push(msg);
    if (logs.length > 100) logs.shift();
  };

  const isWin = process.platform === 'win32';

  const existingBostonclaw = await detectExistingBostonclaw();
  if (existingBostonclaw.length > 0) {
    pushLog(`检测到现有 Bostonclaw 安装/残留: ${existingBostonclaw.join('; ')}`);
  }

  if (!isWin) {
    onProgress({ step: '打开下载页', percent: 50, log: '正在打开 FreeClaw 下载页...' });
    await shell.openExternal(FREECLAW_DOWNLOAD_URL);
    onProgress({ step: '完成', percent: 100, log: '已在浏览器中打开下载页。' });
    return {
      success: true,
      message:
        'FreeClaw 一键安装目前仅支持 Windows。已为你打开下载页，macOS/Linux 用户可查看其他安装方案。',
      nextAction: 'show-guide',
      nextUrl: FREECLAW_DOWNLOAD_URL,
      logs,
    };
  }

  try {
    const existingFreeClaw = await detectExistingFreeClaw();
    let targetExe: string;

    if (existingFreeClaw) {
      onProgress({
        step: '检测 FreeClaw',
        percent: 5,
        log: `检测到已有 FreeClaw: ${existingFreeClaw.path}`,
      });
      pushLog(`复用已有 FreeClaw: ${existingFreeClaw.path}`);
      targetExe = existingFreeClaw.path;
    } else {
      targetExe = await extractBundledFreeClaw(onProgress);
      pushLog(`已释放到: ${targetExe}`);
    }

    onProgress({ step: '启动 FreeClaw', percent: 40, log: `正在启动: ${targetExe}` });
    onProgress({ step: '启动 FreeClaw', percent: 42, log: `$ start "" "${targetExe}"` });
    const opened = await shell.openPath(targetExe);
    if (opened && opened !== '') {
      pushLog(`启动反馈: ${opened}`);
      onProgress({ step: '启动 FreeClaw', percent: 55, log: `[shell] process exited with error: ${opened}` });
    } else {
      pushLog('启动成功');
      onProgress({ step: '启动 FreeClaw', percent: 55, log: '[shell] process exited with code 0' });
    }

    onProgress({ step: '完成', percent: 100, log: 'FreeClaw 已启动，请在其窗口中完成后续安装。' });

    const licensePath = join(getExtractedFreeClawDir(), 'LICENSE-FreeClaw.txt');

    return {
      success: true,
      message:
        '已启动 FreeClaw 安装器。请在其窗口内按向导完成 Ollama、模型与 OpenClaw 的配置。安装过程无需 API Key。',
      nextAction: 'open-app',
      nextUrl: `file://${licensePath}`,
      logs,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    pushLog(`错误: ${message}`);
    return {
      success: false,
      message,
      nextAction: 'show-guide',
      nextUrl: FREECLAW_DOWNLOAD_URL,
      logs,
    };
  }
}
