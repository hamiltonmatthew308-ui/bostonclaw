import { spawn } from 'child_process';
import type { EnvReport, InstallPlan, InstallProgress, RunResult } from '../../shared/types/installer';
import { detectEnvironment } from '../env/detector';

// Use the official installer endpoint (matches the Hermes Agent website guide).
const HERMES_INSTALL_SH = 'https://hermes-agent.nousresearch.com/install.sh';
// The official site currently doesn't expose a PowerShell installer (404),
// so we fall back to the upstream repo for Windows.
const HERMES_INSTALL_PS1 = 'https://raw.githubusercontent.com/NousResearch/hermes-agent/main/install.ps1';

export async function checkEnv(): Promise<EnvReport> {
  return detectEnvironment();
}

export function plan(_env: EnvReport, _opts?: { experimentalWinNative?: boolean }): InstallPlan {
  return {
    steps: [{ id: 'install', label: '运行 Hermes Agent 一键安装脚本', estimate: '1-3 min' }],
    totalEstimate: '1-3 min',
    warnings: [],
  };
}

export async function run(_plan: InstallPlan, onProgress: (p: InstallProgress) => void): Promise<RunResult> {
  return new Promise((resolve) => {
    const isWin = process.platform === 'win32';
    const logLines: string[] = [];
    let percent = 8;
    let lastOutputAt = Date.now();

    onProgress({ step: '启动安装脚本', percent, log: '运行 Hermes Agent 一键安装...' });

    const [cmd, args] = isWin
      ? ['powershell', ['-Command', `irm ${HERMES_INSTALL_PS1} | iex`]]
      : ['bash', ['-c', `curl -fsSL ${HERMES_INSTALL_SH} | bash`]];

    const child = spawn(cmd, args, { shell: false });

    const handleLine = (data: Buffer) => {
      const line = data.toString().trim();
      if (line) {
        logLines.push(line);
        lastOutputAt = Date.now();
        percent = Math.min(92, percent + 1);
        onProgress({ step: '安装中...', percent, log: line });
      }
    };

    child.stdout?.on('data', handleLine);
    child.stderr?.on('data', handleLine);

    const heartbeat = setInterval(() => {
      const now = Date.now();
      if (now - lastOutputAt > 2500) {
        percent = Math.min(90, percent + 1);
        onProgress({ step: '安装中...', percent, log: '...仍在运行，等待脚本输出...' });
        lastOutputAt = now;
      }
    }, 1200);

    child.on('close', (code) => {
      clearInterval(heartbeat);
      if (code === 0) {
        onProgress({ step: '安装完成', percent: 100, log: '✓ Hermes Agent 安装成功' });
        resolve({
          success: true,
          message: 'Hermes Agent 已安装。在终端运行 `hermes start` 即可使用。',
          nextAction: 'show-guide',
          nextUrl: 'https://github.com/NousResearch/hermes-agent#getting-started',
        });
      } else {
        resolve({
          success: false,
          message: `安装脚本退出码 ${code}，请检查网络或权限。`,
          nextAction: 'none',
          logs: logLines.slice(-50),
        });
      }
    });

    child.on('error', (err) => {
      clearInterval(heartbeat);
      resolve({
        success: false,
        message: `无法启动安装脚本: ${err.message}`,
        nextAction: 'none',
        logs: logLines,
      });
    });
  });
}
