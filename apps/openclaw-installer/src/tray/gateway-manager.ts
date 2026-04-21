/**
 * Gateway Manager
 * 管理 OpenClaw Gateway 进程的启动、停止和监控
 *
 * 路径逻辑与 openclaw.ts 保持一致，确保安装完成后托盘能找到 Gateway 入口。
 */
import { utilityProcess, app } from 'electron';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const USER_DATA_PATH = (() => {
  try {
    return app.getPath('userData');
  } catch {
    return join(homedir(), '.bostonclaw-installer');
  }
})();

const OPENCLAW_DIR = join(homedir(), '.openclaw');
const GATEWAY_PORT = 18789;

interface GatewayStatus {
  running: boolean;
  pid?: number;
  url?: string;
  error?: string;
}

export class GatewayManager {
  private process: Electron.UtilityProcess | null = null;
  private status: GatewayStatus = { running: false };

  getStatus(): GatewayStatus {
    return this.status;
  }

  /**
   * 查找 Node.js 可执行文件，优先使用 openclaw.ts 下载的便携版本。
   */
  private getNodePath(): string {
    const platform = process.platform;
    const nodeExe = platform === 'win32' ? 'node.exe' : 'node';

    // 1. Runtime node downloaded by openclaw.ts (ensureNode)
    const runtimeDir = join(USER_DATA_PATH, 'runtime', 'node');
    const version = 'v22.14.0';
    const arch = process.arch === 'arm64' ? 'arm64' : 'x64';

    let filename: string;
    if (platform === 'darwin') {
      filename = `node-${version}-darwin-${arch}`;
    } else if (platform === 'linux') {
      filename = `node-${version}-linux-${arch}`;
    } else {
      filename = `node-${version}-win-x64`;
    }

    const candidates = [
      platform === 'win32'
        ? join(runtimeDir, filename, 'node.exe')
        : join(runtimeDir, filename, 'bin', 'node'),
      // Legacy paths (older installs)
      join(OPENCLAW_DIR, 'node', nodeExe),
      join(OPENCLAW_DIR, 'node', 'bin', nodeExe),
    ];

    for (const c of candidates) {
      if (existsSync(c)) return c;
    }

    return 'node'; // system PATH fallback
  }

  /**
   * 查找 OpenClaw JS 入口，与 openclaw.ts 的 findOpenClawJs / findOpenClawCmd 逻辑一致。
   */
  private getEntryPath(): string | null {
    const npmPrefix = join(USER_DATA_PATH, 'runtime', 'npm-global');

    const candidates = [
      // openclaw.ts installOpenClaw + findOpenClawJs paths
      join(npmPrefix, 'node_modules', 'openclaw', 'bin', 'openclaw.js'),
      join(npmPrefix, 'node_modules', 'openclaw', 'index.js'),
      join(npmPrefix, 'lib', 'node_modules', 'openclaw', 'bin', 'openclaw.js'),
      // Legacy paths
      join(OPENCLAW_DIR, 'openclaw-runtime', 'openclaw.mjs'),
      join(OPENCLAW_DIR, 'openclaw-runtime', 'dist', 'entry.js'),
    ];

    for (const c of candidates) {
      if (existsSync(c)) return c;
    }

    return null;
  }

  private async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`http://127.0.0.1:${GATEWAY_PORT}/health`, {
        signal: controller.signal,
      });

      clearTimeout(timeout);
      return response.ok;
    } catch {
      return false;
    }
  }

  async start(): Promise<void> {
    if (this.process && !this.process.killed) {
      // 检查是否真的在运行
      if (await this.healthCheck()) {
        this.status = {
          running: true,
          pid: this.process.pid,
          url: `http://127.0.0.1:${GATEWAY_PORT}`,
        };
        return;
      }
    }

    const entryPath = this.getEntryPath();

    if (!entryPath) {
      throw new Error('Gateway entry script not found. Please run the installer first.');
    }

    return new Promise((resolve, reject) => {
      this.process = utilityProcess.fork(entryPath, ['gateway'], {
        cwd: OPENCLAW_DIR,
        stdio: 'pipe',
        env: {
          ...process.env,
          OPENCLAW_PORT: String(GATEWAY_PORT),
          OPENCLAW_HOST: '127.0.0.1',
          OPENCLAW_CONFIG_PATH: join(OPENCLAW_DIR, 'openclaw.json'),
          OPENCLAW_HOME: OPENCLAW_DIR,
        },
        serviceName: 'OpenClaw Gateway',
      });

      const timeout = setTimeout(() => {
        reject(new Error('Gateway startup timeout'));
      }, 30000);

      this.process.on('spawn', async () => {
        // 等待健康检查
        for (let i = 0; i < 30; i++) {
          if (await this.healthCheck()) {
            clearTimeout(timeout);
            this.status = {
              running: true,
              pid: this.process?.pid,
              url: `http://127.0.0.1:${GATEWAY_PORT}`,
            };
            resolve();
            return;
          }
          await new Promise((r) => setTimeout(r, 1000));
        }
        clearTimeout(timeout);
        reject(new Error('Gateway health check failed'));
      });

      this.process.on('error', (error) => {
        clearTimeout(timeout);
        this.status = { running: false, error: error.message };
        reject(error);
      });

      this.process.on('exit', (code) => {
        this.status = { running: false };
        if (code !== 0) {
          console.error(`Gateway exited with code ${code}`);
        }
      });
    });
  }

  async stop(): Promise<void> {
    if (this.process && !this.process.killed) {
      this.process.kill();
      this.process = null;
    }
    this.status = { running: false };
  }

  async restart(): Promise<void> {
    await this.stop();
    await new Promise((r) => setTimeout(r, 1000));
    await this.start();
  }
}
