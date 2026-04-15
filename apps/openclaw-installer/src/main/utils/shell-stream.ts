import { spawn } from 'node:child_process';

type StreamName = 'stdout' | 'stderr';

export interface StreamOptions {
  command: string;
  args: string[];
  shell?: boolean;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  step?: string;
  startPercent?: number;
  endPercent?: number;
  onProgress: (p: { step: string; percent: number; log: string }) => void;
}

export interface StreamResult {
  code: number | null;
  logs: string[];
}

function flushByNewline(
  chunk: Buffer,
  stream: StreamName,
  state: { stdout: string; stderr: string },
  onLine: (line: string) => void,
): void {
  const key = stream === 'stdout' ? 'stdout' : 'stderr';
  state[key] += chunk.toString();
  const parts = state[key].split(/\r?\n/);
  state[key] = parts.pop() ?? '';
  for (const raw of parts) {
    const line = raw.trim();
    if (!line) continue;
    onLine(stream === 'stderr' ? `[stderr] ${line}` : line);
  }
}

export async function runShellStream(opts: StreamOptions): Promise<StreamResult> {
  const step = opts.step ?? '执行命令';
  const startPercent = opts.startPercent ?? 8;
  const endPercent = opts.endPercent ?? 92;
  const logs: string[] = [];
  let percent = startPercent;
  let lastOutputAt = Date.now();

  const addLog = (line: string) => {
    logs.push(line);
    if (logs.length > 300) logs.shift();
    lastOutputAt = Date.now();
    percent = Math.min(endPercent, percent + 1);
    opts.onProgress({ step, percent, log: line });
  };

  const visible = `$ ${opts.command} ${opts.args.join(' ')}`.trim();
  opts.onProgress({ step, percent: Math.max(startPercent, 10), log: visible });

  return await new Promise<StreamResult>((resolve, reject) => {
    const child = spawn(opts.command, opts.args, {
      shell: opts.shell ?? false,
      cwd: opts.cwd,
      env: opts.env,
    });
    addLog(`[shell] pid=${child.pid ?? 'unknown'}`);

    const state = { stdout: '', stderr: '' };
    child.stdout?.on('data', (chunk: Buffer) => flushByNewline(chunk, 'stdout', state, addLog));
    child.stderr?.on('data', (chunk: Buffer) => flushByNewline(chunk, 'stderr', state, addLog));

    const heartbeat = setInterval(() => {
      const now = Date.now();
      if (now - lastOutputAt > 2500) {
        percent = Math.min(endPercent - 1, percent + 1);
        opts.onProgress({ step, percent, log: '...仍在运行，等待脚本输出...' });
        lastOutputAt = now;
      }
    }, 1200);

    child.on('error', (error) => {
      clearInterval(heartbeat);
      reject(error);
    });

    child.on('close', (code) => {
      clearInterval(heartbeat);
      if (state.stdout.trim()) addLog(state.stdout.trim());
      if (state.stderr.trim()) addLog(`[stderr] ${state.stderr.trim()}`);
      addLog(`[shell] process exited with code ${code ?? -1}`);
      resolve({ code, logs });
    });
  });
}
