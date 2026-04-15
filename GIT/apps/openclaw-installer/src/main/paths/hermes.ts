import type { EnvReport, InstallPlan, InstallProgress, RunResult } from '../../shared/types/installer';
import { detectEnvironment } from '../env/detector';

export async function checkEnv(): Promise<EnvReport> {
  return detectEnvironment();
}

export function plan(env: EnvReport, _opts?: { experimentalWinNative?: boolean }): InstallPlan {
  const warnings: string[] = [];
  if (env.os.platform === 'win') warnings.push('Hermes Agent 原生 Windows 不支持，建议使用 WSL2。');
  return {
    steps: [{ id: 'guide', label: '打开 Hermes Agent 官方安装指南', estimate: '2-5 min' }],
    totalEstimate: '2-5 min',
    warnings,
  };
}

export async function run(_plan: InstallPlan, onProgress: (p: InstallProgress) => void): Promise<RunResult> {
  onProgress({ step: '准备打开 Hermes 指南', percent: 100, log: '将跳转到 Hermes Agent 官方 Quick Install。' });
  return {
    success: true,
    message: '已准备好查看 Hermes Agent 安装指南。',
    nextAction: 'show-guide',
    nextUrl: 'https://github.com/NousResearch/hermes-agent#quick-install',
  };
}

