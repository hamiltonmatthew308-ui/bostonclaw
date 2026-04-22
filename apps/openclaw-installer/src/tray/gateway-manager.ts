/**
 * Gateway Manager
 * Manage OpenClaw Gateway process lifecycle (start, stop, monitor) for the tray icon.
 *
 * Path logic mirrors openclaw.ts to ensure the tray finds the gateway entry after install.
 */
import { utilityProcess, app } from 'electron';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { GATEWAY_PORT, OPENCLAW_DIR_NAME } from '../../shared/constants';

const USER_DATA_PATH = (() => {
  try {
    return app.getPath('userData');
  } catch {
    return join(homedir(), '.bostonclaw-installer');
  }
})();

const OPENCLAW_DIR = join(homedir(), OPENCLAW_DIR_NAME);

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
   * Find the Node.js executable, matching the layout used by openclaw.ts ensureNode().
   */
  private getNodePath(): string {
    const platform = process.platform;
    const nodeExe = platform === 'win32' ? 'node.exe' : 'node';
    const runtimeDir = join(USER_DATA_PATH, 'runtime', 'node');

    // Scan for extracted node dirs (in case version changes, find any node-* dir)
    const candidates: string[] = [];
    if (existsSync(runtimeDir)) {
      const entries = readdirSync(runtimeDir).filter((d) => d.startsWith('node-'));
      for (const d of entries) {
        candidates.push(
          platform === 'win32'
            ? join(runtimeDir, d, 'node.exe')
            : join(runtimeDir, d, 'bin', 'node'),
        );
      }
    }
    // Legacy paths
    candidates.push(
      join(OPENCLAW_DIR, 'node', nodeExe),
      join(OPENCLAW_DIR, 'node', 'bin', nodeExe),
    );

    for (const c of candidates) {
      if (existsSync(c)) return c;
    }
    return 'node';
  }

  /**
   * Find OpenClaw entry point. Matches openclaw.ts findOpenClawJs paths.
   */
  private getEntryPath(): string | null {
    const npmPrefix = join(USER_DATA_PATH, 'runtime', 'npm-global');

    const candidates = [
      join(npmPrefix, 'node_modules', 'openclaw', 'openclaw.mjs'),
      join(npmPrefix, 'node_modules', 'openclaw', 'dist', 'entry.js'),
      join(npmPrefix, 'lib', 'node_modules', 'openclaw', 'openclaw.mjs'),
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
      throw new Error('Gateway entry not found. Please run the installer first.');
    }

    return new Promise((resolve, reject) => {
      this.process = utilityProcess.fork(entryPath, ['gateway', 'run', `--port=${GATEWAY_PORT}`], {
        cwd: OPENCLAW_DIR,
        stdio: 'pipe',
        env: {
          ...process.env,
          OPENCLAW_CONFIG_PATH: join(OPENCLAW_DIR, 'openclaw.json'),
          OPENCLAW_HOME: OPENCLAW_DIR,
        },
        serviceName: 'OpenClaw Gateway',
      });

      const timeout = setTimeout(() => {
        reject(new Error('Gateway startup timeout'));
      }, 30000);

      this.process.on('spawn', async () => {
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
