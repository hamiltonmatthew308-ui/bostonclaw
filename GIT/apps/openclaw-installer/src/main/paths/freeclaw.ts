import type { EnvReport, InstallPlan, InstallProgress, RunResult } from '../../shared/types/installer';
import { detectEnvironment } from '../env/detector';

export async function checkEnv(): Promise<EnvReport> {
  return detectEnvironment();
}

export function plan(env: EnvReport, _opts?: { experimentalWinNative?: boolean }): InstallPlan {
  const warnings: string[] = [];
  if (env.os.platform !== 'win') warnings.push('FreeClaw 当前仅支持 Windows。macOS/Linux 将回退到原版 OpenClaw。');
  if (env.diskFreeGB > 0 && env.diskFreeGB < 10) warnings.push('可用磁盘空间偏少。本地模型可能需要 10GB+ 空间。');

  return {
    steps: [
      { id: 'download', label: '下载 FreeClaw 启动器', estimate: '2-5 min' },
      { id: 'run', label: '运行启动器并按向导安装', estimate: '5-20 min' },
    ],
    totalEstimate: '10-25 min',
    warnings,
  };
}

export async function run(_plan: InstallPlan, onProgress: (p: InstallProgress) => void): Promise<RunResult> {
  onProgress({
    step: '准备下载 FreeClaw',
    percent: 10,
    log: '此版本建议直接下载 FreeClaw Release 并运行，由其完成 Node/Ollama/OpenClaw 安装。',
  });
  onProgress({ step: '等待用户运行 FreeClaw', percent: 100, log: '完成后请回到 Lobster 社区学习模板与用法。' });
  return {
    success: true,
    message: '已准备好下载 FreeClaw（Windows 便携启动器）。',
    nextAction: 'show-guide',
    nextUrl: 'https://lobster.community/download?path=freeclaw',
  };
}

