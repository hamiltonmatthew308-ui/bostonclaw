import type { EnvReport, InstallPlan, InstallProgress, RunResult } from '../../shared/types/installer';
import { detectEnvironment } from '../env/detector';

export async function checkEnv(): Promise<EnvReport> {
  return detectEnvironment();
}

export function plan(_env: EnvReport, _opts?: { experimentalWinNative?: boolean }): InstallPlan {
  return {
    steps: [{ id: 'redirect', label: '选择厂商版本并跳转下载', estimate: '1 min' }],
    totalEstimate: '1 min',
    warnings: [],
  };
}

export async function run(_plan: InstallPlan, onProgress: (p: InstallProgress) => void): Promise<RunResult> {
  onProgress({ step: '准备跳转到厂商下载页', percent: 100, log: '此路径不在安装器内执行安装，仅做分发跳转。' });
  return {
    success: true,
    message: '已准备好跳转到厂商封装版下载页。',
    nextAction: 'show-guide',
    nextUrl: 'https://bostonclaw.community/download',
  };
}
