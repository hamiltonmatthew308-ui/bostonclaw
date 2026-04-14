/**
 * Installer Engine - 统一调度各路径的执行
 *
 * 约束：Renderer 只负责 UI；Main 负责真实的环境检测/执行/日志。
 */
import type { EnvReport, InstallPlan, InstallProgress, RunResult } from '../shared/types/installer';

import * as vendor from './paths/vendor';
import * as openclaw from './paths/openclaw';
import * as freeclaw from './paths/freeclaw';
import * as hermes from './paths/hermes';
import * as wechat from './paths/wechat';

const PATHS = {
  vendor,
  openclaw,
  freeclaw,
  hermes,
  wechat,
} as const;

export type PathId = keyof typeof PATHS;

function assertPathId(pathId: string): asserts pathId is PathId {
  if (!(pathId in PATHS)) {
    throw new Error(`Unknown install path: ${pathId}`);
  }
}

export async function checkEnvForPath(pathId: string): Promise<EnvReport> {
  assertPathId(pathId);
  return PATHS[pathId].checkEnv();
}

export async function planForPath(pathId: string, opts?: { experimentalWinNative?: boolean }): Promise<InstallPlan> {
  assertPathId(pathId);
  const env = await PATHS[pathId].checkEnv();
  return PATHS[pathId].plan(env, opts);
}

export async function runPath(
  pathId: string,
  plan: InstallPlan,
  onProgress: (p: InstallProgress) => void,
): Promise<RunResult> {
  assertPathId(pathId);
  try {
    return await PATHS[pathId].run(plan, onProgress);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, message, nextAction: 'none', logs: [] };
  }
}

