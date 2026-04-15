import { spawn } from 'child_process';
import type { EnvReport, InstallPlan, InstallProgress, RunResult } from '../../shared/types/installer';
import { detectEnvironment } from '../env/detector';
import { runShellStream } from '../utils/shell-stream';

const HERMES_INSTALL_SH = 'https://hermes-agent.nousresearch.com/install.sh';

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

/**
 * 安装后验证：检查 hermes 是否在 PATH 上可用
 */
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
      // 尝试获取版本号
      const verChild = spawn('hermes', ['--version'], { shell: false });
      let verOut = '';
      verChild.stdout?.on('data', (d: Buffer) => { verOut += d.toString().trim(); });
      verChild.stderr?.on('data', () => {});
      verChild.on('error', () => resolve({ found: true, path: foundPath, version: null }));
      verChild.on('close', () => resolve({ found: true, path: foundPath, version: verOut || null }));
    });
  });
}

/**
 * 分析常见安装失败原因，给出中文可操作提示
 */
function diagnoseFailure(logText: string): string {
  const t = logText.toLowerCase();

  if (t.includes('proxy') || t.includes('tunnel') || t.includes('econnrefused') || t.includes('proxyconnect')) {
    return '网络连接失败，可能是代理或防火墙拦截了请求。请检查网络代理设置后重试。';
  }
  if (t.includes('certificate') || t.includes('ssl') || t.includes('self-signed') || t.includes('cert')) {
    return 'SSL 证书验证失败，可能是企业网络拦截了 HTTPS 流量。请联系 IT 部门或将安装脚本下载到本地执行。';
  }
  if (t.includes('execution policy') || t.includes('running scripts is disabled') || t.includes('cannot be loaded because')) {
    return 'Windows 执行策略禁止了脚本运行。请以管理员身份打开 PowerShell 执行：Set-ExecutionPolicy RemoteSigned -Scope CurrentUser，然后重试。';
  }
  if (t.includes('permission') || t.includes('access denied') || t.includes('eacces') || t.includes('epERM')) {
    return '权限不足。请尝试以管理员身份运行安装器，或检查目标目录的写入权限。';
  }
  if (t.includes('timeout') || t.includes('etimedout') || t.includes('etimmedout')) {
    return '下载超时，网络可能不稳定。请检查网络连接后重试，或尝试使用镜像源。';
  }
  if (t.includes('curl') && (t.includes('not found') || t.includes('command not found'))) {
    return '系统中未找到 curl 命令。macOS/Linux 请先安装 curl，Windows 请确认系统环境正常。';
  }
  if (t.includes('python') && (t.includes('not found') || t.includes('command not found'))) {
    return 'Hermes 需要 Python 环境。请先安装 Python 3.8+：https://www.python.org/downloads/';
  }

  return '';
}

export async function run(_plan: InstallPlan, onProgress: (p: InstallProgress) => void): Promise<RunResult> {
  return new Promise((resolve) => {
    const isWin = process.platform === 'win32';
    const logLines: string[] = [];

    onProgress({ step: '启动安装脚本', percent: 8, log: '运行 Hermes Agent 一键安装...' });

    const unixInstallCmd = `curl -fsSL ${HERMES_INSTALL_SH} | bash`;
    const candidates = isWin
      ? [
          { command: 'bash', args: ['-lc', unixInstallCmd], hint: 'Git Bash' },
          { command: 'wsl', args: ['bash', '-lc', unixInstallCmd], hint: 'WSL' },
        ]
      : [{ command: 'bash', args: ['-c', unixInstallCmd], hint: 'bash' }];

    const runAttempt = (idx: number): void => {
      const candidate = candidates[idx];
      if (!candidate) {
        resolve({
          success: false,
          message:
            '无法启动 Hermes 安装脚本：未找到可用的 bash 环境。Windows 请安装 Git Bash 或启用 WSL 后重试。',
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
        onProgress: (p) => {
          const line = p.log.trim();
          if (line) logLines.push(line);
          onProgress(p);
        },
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
              : `安装脚本退出码 ${code}，请检查网络或权限后重试。`;

            resolve({
              success: false,
              message,
              nextAction: 'none',
              logs: logLines.slice(-50),
            });
            return;
          }

          // 脚本执行成功，运行安装后验证
          onProgress({ step: '验证安装', percent: 95, log: '脚本完成，正在验证 Hermes 是否可用...' });

          void verifyHermes().then((ver) => {
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
              // 脚本成功但 hermes 不在 PATH 上
              onProgress({ step: '验证完成', percent: 98, log: '⚠ 脚本成功，但 hermes 命令未在 PATH 中找到。可能需要重新打开终端。' });
              resolve({
                success: true,
                message: '安装脚本已成功执行，但未检测到 hermes 命令。请重新打开终端后运行 `hermes start`。如果仍然找不到，请尝试手动添加 PATH。',
                nextAction: 'show-guide',
                nextUrl: 'https://github.com/NousResearch/hermes-agent#getting-started',
              });
            }
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
