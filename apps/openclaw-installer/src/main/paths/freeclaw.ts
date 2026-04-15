import { shell } from 'electron';
import type { EnvReport, InstallPlan, InstallProgress, RunResult } from '../../shared/types/installer';
import { detectEnvironment } from '../env/detector';

const FREECLAW_DOWNLOAD_URL = 'https://github.com/wangdali-dev/FreeClaw/releases/latest';

export async function checkEnv(): Promise<EnvReport> {
  return detectEnvironment();
}

export function plan(env: EnvReport, _opts?: { experimentalWinNative?: boolean }): InstallPlan {
  const warnings: string[] = [];
  if (env.diskFreeGB > 0 && env.diskFreeGB < 10) {
    warnings.push('可用磁盘空间偏少，本地模型通常需要 10GB+ 空间。');
  }
  return {
    steps: [
      { id: 'download', label: '打开 FreeClaw 下载页', estimate: '< 1 min' },
      { id: 'install', label: '运行启动器，按向导安装 Ollama + 模型', estimate: '5-20 min' },
    ],
    totalEstimate: '5-20 min',
    warnings,
  };
}

export async function run(_plan: InstallPlan, onProgress: (p: InstallProgress) => void): Promise<RunResult> {
  onProgress({ step: '打开下载页', percent: 50, log: `正在打开 FreeClaw 下载页...` });
  await shell.openExternal(FREECLAW_DOWNLOAD_URL);
  onProgress({ step: '完成', percent: 100, log: '已在浏览器中打开下载页，请下载并运行安装程序。' });
  return {
    success: true,
    message: '已打开 FreeClaw 下载页。下载并运行安装包，它会引导你完成 Ollama 与模型安装，无需 API Key。',
    nextAction: 'show-guide',
    nextUrl: FREECLAW_DOWNLOAD_URL,
  };
}
