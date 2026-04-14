/**
 * Gateway Manager
 * 管理 OpenClaw Gateway 进程的启动、停止和监控
 */
import { utilityProcess } from 'electron';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

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

  private getNodePath(): string {
    const nodeExe = process.platform === 'win32' ? 'node.exe' : 'node';
    // 优先使用内置 Node.js
    const bundledPath = join(OPENCLAW_DIR, 'node', nodeExe);
    if (existsSync(bundledPath)) {
      return bundledPath;
    }
    // 备选 bin 目录
    const binPath = join(OPENCLAW_DIR, 'node', 'bin', nodeExe);
    if (existsSync(binPath)) {
      return binPath;
    }
    return 'node'; // 系统 PATH
  }

  private getEntryPath(): string | null {
    const runtimeDir = join(OPENCLAW_DIR, 'openclaw-runtime');
    const entryPath = join(runtimeDir, 'openclaw.mjs');
    
    if (existsSync(entryPath)) {
      return entryPath;
    }
    
    const altEntryPath = join(runtimeDir, 'dist', 'entry.js');
    if (existsSync(altEntryPath)) {
      return altEntryPath;
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
      throw new Error('Gateway entry script not found');
    }

    return new Promise((resolve, reject) => {
      this.process = utilityProcess.fork(entryPath, ['gateway'], {
        cwd: OPENCLAW_DIR,
        stdio: 'pipe',
        env: {
          ...process.env,
          OPENCLAW_PORT: String(GATEWAY_PORT),
          OPENCLAW_HOST: '127.0.0.1',
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
          await new Promise(r => setTimeout(r, 1000));
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
    await new Promise(r => setTimeout(r, 1000));
    await this.start();
  }
}
