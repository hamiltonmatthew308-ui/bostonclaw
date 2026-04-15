import type { EnvReport, InstallPlan, InstallProgress, RunResult, ProviderConfig } from '../../shared/types/installer';
import { detectEnvironment } from '../env/detector';
import { app } from 'electron';
import { homedir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { existsSync, createWriteStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { get } from 'node:https';

const execFileAsync = promisify(execFile);

const OPENCLAW_DIR = join(homedir(), '.openclaw');
const GATEWAY_PORT = 18789;

function getUserDataPath(): string {
  try {
    return app.getPath('userData');
  } catch {
    return join(homedir(), '.lobster-installer');
  }
}

function classifyDownloadError(err: unknown, statusCode?: number): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (statusCode === 403) return '下载被服务器拒绝（403），可能是公司网络限制或镜像需要认证。';
  if (statusCode === 404) return '下载地址不存在（404），可能是版本号已变更。';
  if (statusCode && statusCode >= 500) return `服务器错误（${statusCode}），请稍后重试。`;
  if (msg.includes('ECONNRESET') || msg.includes('ETIMEDOUT') || msg.includes('timeout')) {
    return '网络连接超时或中断，请检查网络、代理或防火墙设置。';
  }
  if (msg.includes('certificate') || msg.includes('CERT_') || msg.includes('TLS')) {
    return 'SSL 证书验证失败，请检查公司代理或尝试设置 NODE_EXTRA_CA_CERTS。';
  }
  if (msg.includes('ECONNREFUSED')) {
    return '连接被拒绝，请检查是否能访问 nodejs.org，或是否需要配置代理。';
  }
  return `下载失败: ${msg}`;
}

async function downloadFile(url: string, dest: string, onProgress?: (percent: number) => void): Promise<void> {
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
  const agent = proxy ? new (await import('https-proxy-agent')).HttpsProxyAgent(proxy) : undefined;
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    let statusCode: number | undefined;
    const req = get(url, { agent }, (response) => {
      statusCode = response.statusCode;
      if (statusCode === 301 || statusCode === 302) {
        const location = response.headers.location;
        if (location) {
          downloadFile(location, dest, onProgress).then(resolve).catch(reject);
          return;
        }
      }
      if (statusCode && statusCode >= 400) {
        file.close();
        reject(new Error(classifyDownloadError(null, statusCode)));
        return;
      }
      const total = parseInt(response.headers['content-length'] || '0', 10);
      let downloaded = 0;
      let idleTimeout: NodeJS.Timeout | null = null;
      const resetIdle = () => {
        if (idleTimeout) clearTimeout(idleTimeout);
        idleTimeout = setTimeout(() => {
          req.destroy();
          reject(new Error(classifyDownloadError(new Error('ETIMEDOUT'))));
        }, 300000);
      };
      response.on('data', (chunk: Buffer) => {
        downloaded += chunk.length;
        if (total && onProgress) {
          onProgress(downloaded / total);
        }
        resetIdle();
      });
      resetIdle();
      response.pipe(file);
      file.on('finish', () => {
        if (idleTimeout) clearTimeout(idleTimeout);
        file.close();
        resolve();
      });
    });
    req.on('error', (err) => {
      file.close();
      reject(new Error(classifyDownloadError(err)));
    });
  });
}

async function ensureNode(env: EnvReport, onProgress: (p: InstallProgress) => void): Promise<string> {
  if (env.nodejs.installed && env.nodejs.path) {
    onProgress({ step: '检查 Node.js', percent: 5, log: `检测到系统 Node.js: ${env.nodejs.version}` });
    return env.nodejs.path;
  }

  onProgress({ step: '下载 Node.js', percent: 10, log: '未检测到系统 Node.js，开始下载便携版本...' });

  const arch = env.os.arch === 'arm64' ? 'arm64' : 'x64';
  const runtimeDir = join(getUserDataPath(), 'runtime', 'node');
  await mkdir(runtimeDir, { recursive: true });

  const version = 'v22.14.0';
  const platform = env.os.platform;
  let filename: string;
  let ext: string;
  let nodeExe: string;

  if (platform === 'mac') {
    filename = `node-${version}-darwin-${arch}`;
    ext = 'tar.xz';
    nodeExe = join(runtimeDir, filename, 'bin', 'node');
  } else if (platform === 'linux') {
    filename = `node-${version}-linux-${arch}`;
    ext = 'tar.xz';
    nodeExe = join(runtimeDir, filename, 'bin', 'node');
  } else {
    filename = `node-${version}-win-x64`;
    ext = 'zip';
    nodeExe = join(runtimeDir, filename, 'node.exe');
  }

  if (existsSync(nodeExe)) {
    onProgress({ step: '复用已下载 Node.js', percent: 20, log: `复用缓存: ${nodeExe}` });
    return nodeExe;
  }

  const url = `https://nodejs.org/dist/${version}/${filename}.${ext}`;
  const manualUrl = `https://nodejs.org/dist/${version}/`;
  const downloadPath = join(runtimeDir, `${filename}.${ext}`);

  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      onProgress({ step: '下载 Node.js', percent: 15, log: `从 ${url} 下载...（尝试 ${attempt}/2）` });
      await downloadFile(url, downloadPath, (pct) => {
        const mapped = 15 + Math.floor(pct * 25);
        onProgress({ step: '下载 Node.js', percent: mapped, log: `下载进度: ${Math.floor(pct * 100)}%` });
      });

      onProgress({ step: '下载 Node.js', percent: 40, log: '下载完成，开始解压...' });

      if (platform === 'win') {
        await execFileAsync('powershell.exe', ['-Command', `Expand-Archive -Path "${downloadPath}" -DestinationPath "${runtimeDir}" -Force`]);
      } else {
        await execFileAsync('tar', ['-xf', downloadPath, '-C', runtimeDir]);
      }

      onProgress({ step: '下载 Node.js', percent: 50, log: '解压完成' });

      if (!existsSync(nodeExe)) {
        throw new Error(`Node.js 下载/解压后未找到可执行文件: ${nodeExe}`);
      }

      onProgress({ step: '下载 Node.js', percent: 55, log: `Node.js 已就绪: ${nodeExe}` });
      return nodeExe;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      onProgress({ step: '下载 Node.js', percent: 15, log: `下载失败: ${lastError.message}` });
      if (attempt < 2) {
        onProgress({ step: '下载 Node.js', percent: 15, log: '5秒后重试...' });
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }

  const tips = [
    '',
    '排查建议：',
    '1. 检查网络是否能访问 https://nodejs.org',
    '2. 若在公司内网，请配置系统代理或 HTTP_PROXY 环境变量',
    '3. 若证书被拦截，可设置 NODE_EXTRA_CA_CERTS 指向公司根证书',
    `4. 手动下载地址: ${manualUrl}（找到 ${filename}.${ext} 并放入 ${runtimeDir} 后重试）`,
  ].join('\n');

  throw new Error(`${lastError?.message || '未知错误'}${tips}`);
}

async function installOpenClaw(
  nodePath: string,
  onProgress: (p: InstallProgress) => void
): Promise<string> {
  const npmPrefix = join(getUserDataPath(), 'runtime', 'npm-global');
  const npmCli = process.platform === 'win32'
    ? join(nodePath, '..', 'node_modules', 'npm', 'bin', 'npm-cli.js')
    : join(nodePath, '..', '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js');
  await mkdir(npmPrefix, { recursive: true });

  onProgress({ step: '安装 OpenClaw', percent: 40, log: `npm install -g openclaw@latest --prefix=${npmPrefix}` });

  await execFileAsync(nodePath, [
    npmCli,
    'install',
    '-g',
    'openclaw@latest',
    `--prefix=${npmPrefix}`,
  ], { timeout: 300000 });

  const openclawCmd = await findOpenClawCmd(npmPrefix);

  if (!openclawCmd) {
    throw new Error('OpenClaw 安装后未找到可执行文件');
  }

  onProgress({ step: '安装 OpenClaw', percent: 60, log: '安装完成' });
  return openclawCmd;
}

async function resolveOpenClawCmd(_nodePath: string): Promise<string | null> {
  const npmPrefix = join(getUserDataPath(), 'runtime', 'npm-global');
  const localCmd = await findOpenClawCmd(npmPrefix);
  if (localCmd) return localCmd;

  try {
    if (process.platform === 'win32') {
      const { stdout } = await execFileAsync('where', ['openclaw.cmd'], { windowsHide: true });
      const hit = stdout.split(/\r?\n/).map((x) => x.trim()).filter(Boolean)[0];
      return hit || null;
    }
    await execFileAsync('openclaw', ['--version']);
    return 'openclaw';
  } catch {
    return null;
  }
}

async function findOpenClawCmd(npmPrefix: string): Promise<string | null> {
  if (process.platform === 'win32') {
    const candidates = [
      join(npmPrefix, 'openclaw.cmd'),
      join(npmPrefix, 'bin', 'openclaw.cmd'),
    ];
    for (const c of candidates) {
      if (existsSync(c)) return c;
    }
    return null;
  }
  const c = join(npmPrefix, 'bin', 'openclaw');
  return existsSync(c) ? c : null;
}

function inferNpmPrefix(cmd: string): string {
  const name = basename(cmd);
  const dir = dirname(cmd);
  const expected = process.platform === 'win32' ? 'openclaw.cmd' : 'openclaw';
  if (name === expected && basename(dir) === 'bin') {
    return dirname(dir);
  }
  return dir;
}

function findOpenClawJs(npmPrefix: string): string | null {
  const candidates = [
    join(npmPrefix, 'node_modules', 'openclaw', 'bin', 'openclaw.js'),
    join(npmPrefix, 'node_modules', 'openclaw', 'index.js'),
    join(npmPrefix, 'lib', 'node_modules', 'openclaw', 'bin', 'openclaw.js'),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return null;
}

async function writeOpenClawConfig(provider?: ProviderConfig): Promise<void> {
  await mkdir(OPENCLAW_DIR, { recursive: true });
  const configPath = join(OPENCLAW_DIR, 'openclaw.json');
  const config = {
    version: '1.0.0',
    gateway: {
      enabled: true,
      port: GATEWAY_PORT,
      host: '127.0.0.1',
    },
    providers: provider
      ? [
          {
            id: provider.id,
            name: provider.name,
            baseUrl: provider.baseUrl,
            defaultModel: provider.defaultModel,
            apiKey: provider.apiKey,
          },
        ]
      : [],
    channels: {},
    plugins: {
      allow: [],
      enabled: true,
      entries: {},
    },
    skills: {
      directories: [join(OPENCLAW_DIR, 'skills')],
    },
  };
  await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

async function startGateway(
  openclawCmd: string,
  nodePath: string,
  onProgress: (p: InstallProgress) => void
): Promise<void> {
  onProgress({ step: '启动 Gateway', percent: 75, log: `执行: ${openclawCmd} gateway run --port ${GATEWAY_PORT}` });

  await mkdir(join(OPENCLAW_DIR, 'logs'), { recursive: true });

  const logPath = join(OPENCLAW_DIR, 'logs', 'gateway.log');
  const logStream = createWriteStream(logPath, { flags: 'a' });

  const args = ['gateway', 'run', `--port=${GATEWAY_PORT}`, '--verbose'];
  const isWin = process.platform === 'win32';

  let spawnCmd = openclawCmd;
  let spawnArgs = args;
  let spawnShell = false;

  if (isWin) {
    const npmPrefix = inferNpmPrefix(openclawCmd);
    const jsEntry = findOpenClawJs(npmPrefix);
    if (jsEntry) {
      spawnCmd = nodePath;
      spawnArgs = [jsEntry, ...args];
      spawnShell = false;
    } else {
      spawnShell = true;
    }
  }

  const child = spawn(spawnCmd, spawnArgs, {
    detached: true,
    shell: spawnShell,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      OPENCLAW_CONFIG_PATH: join(OPENCLAW_DIR, 'openclaw.json'),
      OPENCLAW_HOME: OPENCLAW_DIR,
    },
  });

  child.stdout?.pipe(logStream);
  child.stderr?.pipe(logStream);
  child.unref();

  const pidPath = join(getUserDataPath(), 'runtime', 'gateway.pid');
  if (child.pid) {
    await writeFile(pidPath, String(child.pid), 'utf-8');
  }

  // Wait for HTTP ready
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${GATEWAY_PORT}/`);
      if (res.ok) {
        onProgress({ step: '验证 Gateway', percent: 90, log: 'Gateway 已就绪' });
        return;
      }
      if (res.status >= 500) {
        // Server up but erroring; give it a bit more time
        await new Promise((r) => setTimeout(r, 800));
        continue;
      }
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 800));
  }

  try {
    child.kill();
  } finally {
    logStream.end();
  }
  throw new Error('Gateway 在 15 秒内未就绪，请检查端口是否被占用或 Node 版本是否兼容');
}

export async function checkEnv(): Promise<EnvReport> {
  return detectEnvironment();
}

export function plan(env: EnvReport, opts?: { experimentalWinNative?: boolean }): InstallPlan {
  const warnings: string[] = [];
  if (env.os.platform === 'win' && !env.wsl2) {
    if (opts?.experimentalWinNative) {
      warnings.push('你已启用 Windows 原生实验路径，如遇问题请改用 WSL2 或厂商封装版。');
    } else {
      warnings.push('Windows 原生路径为实验性支持，建议启用 WSL2 获得最佳体验。');
    }
  }
  if (env.diskFreeGB > 0 && env.diskFreeGB < 2) {
    warnings.push('可用磁盘空间不足（建议至少 2GB）。');
  }
  if (!env.nodejs.installed) {
    const canAutoDownload = env.os.platform === 'mac' || env.os.platform === 'linux' || opts?.experimentalWinNative;
    if (canAutoDownload) {
      warnings.push('未检测到 Node.js，安装器将尝试自动下载便携版本。');
    } else {
      warnings.push('未检测到 Node.js。Windows 默认路径下不会自动下载，建议启用 WSL2 或手动安装 Node.js。');
    }
  }

  return {
    steps: [
      { id: 'preflight', label: '检查 Node.js / 网络 / 磁盘', estimate: '1 min' },
      { id: 'install', label: '安装 OpenClaw runtime', estimate: '3-10 min' },
      { id: 'configure', label: '写入配置并启动 Gateway', estimate: '1-3 min' },
      { id: 'verify', label: '验证 dashboard 可访问', estimate: '1 min' },
    ],
    totalEstimate: '6-15 min',
    warnings,
    experimentalWinNative: opts?.experimentalWinNative,
  };
}

export async function run(plan: InstallPlan, onProgress: (p: InstallProgress) => void): Promise<RunResult> {
  const logs: string[] = [];
  const pushLog = (msg: string) => {
    logs.push(msg);
    if (logs.length > 100) logs.shift();
  };

  try {
    const env = await detectEnvironment();

    // If gateway is already up, treat it as installed and succeed immediately.
    try {
      const res = await fetch(`http://127.0.0.1:${GATEWAY_PORT}/`);
      if (res.ok || res.status < 500) {
        return {
          success: true,
          message: '检测到 OpenClaw Gateway 已在运行。',
          nextAction: 'open-browser',
          nextUrl: `http://127.0.0.1:${GATEWAY_PORT}/`,
          logs,
        };
      }
    } catch {
      // ignore
    }

    // Windows without WSL2: default to guide unless experimental switch is on
    if (env.os.platform === 'win' && !env.wsl2 && !plan.experimentalWinNative) {
      return {
        success: true,
        message: 'Windows 环境下建议先安装 WSL2，再运行 OpenClaw 可获得最佳稳定性。',
        nextAction: 'show-guide',
        nextUrl: 'https://learn.microsoft.com/zh-cn/windows/wsl/install',
        logs,
      };
    }

    onProgress({ step: '检查环境', percent: 5, log: `平台: ${env.os.platform} ${env.os.arch}` });

    const nodePath = await ensureNode(env, onProgress);
    pushLog(`Node.js: ${nodePath}`);

    const existing = await resolveOpenClawCmd(nodePath);
    const openclawCmd = existing ?? (await installOpenClaw(nodePath, onProgress));
    pushLog(`OpenClaw: ${openclawCmd}`);

    await writeOpenClawConfig(plan.provider);
    pushLog('配置已写入');

    await startGateway(openclawCmd, nodePath, onProgress);
    pushLog('Gateway 启动成功');

    onProgress({ step: '完成', percent: 100, log: '全部完成' });

    return {
      success: true,
      message: 'OpenClaw 安装并启动成功。',
      nextAction: 'open-browser',
      nextUrl: `http://127.0.0.1:${GATEWAY_PORT}/`,
      logs,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    pushLog(`错误: ${message}`);
    return {
      success: false,
      message,
      nextAction: 'none',
      logs,
    };
  }
}
