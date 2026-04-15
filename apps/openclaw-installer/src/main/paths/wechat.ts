import type { EnvReport, InstallPlan, InstallProgress, RunResult } from '../../shared/types/installer';
import { detectEnvironment } from '../env/detector';

export async function checkEnv(): Promise<EnvReport> {
  return detectEnvironment();
}

export function plan(_env: EnvReport, _opts?: { experimentalWinNative?: boolean }): InstallPlan {
  return {
    steps: [{ id: 'recommend', label: '推荐支持微信接入的发行版', estimate: '1 min' }],
    totalEstimate: '1 min',
    warnings: [],
  };
}

export async function run(_plan: InstallPlan, onProgress: (p: InstallProgress) => void): Promise<RunResult> {
  onProgress({ step: '推荐 QClaw', percent: 100, log: '微信接入建议使用腾讯 QClaw（自带相关集成）。' });
  return {
    success: true,
    message: '已推荐 QClaw（微信接入）。',
    nextAction: 'show-guide',
    nextUrl: 'https://bostonclaw.community/download?q=qclaw',
  };
}
