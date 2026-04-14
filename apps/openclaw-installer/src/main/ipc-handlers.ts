/**
 * IPC Handlers (r03)
 *
 * 仅保留向导所需的最小 IPC：installer:* + provider:validate + shell/app 基础能力。
 * 旧版 modules/* 已不存在，避免再次出现“导入缺失文件导致主进程启动失败”。
 */
import { app, ipcMain, shell } from 'electron';

import type { InstallPath, InstallPlan } from '../shared/types/installer';
import { checkEnvForPath, planForPath, runPath } from './engine';

export function registerIpcHandlers(): void {
  ipcMain.handle('installer:checkEnv', async (_evt, path: InstallPath) => {
    return await checkEnvForPath(path);
  });

  ipcMain.handle('installer:plan', async (_evt, path: InstallPath, opts?: { experimentalWinNative?: boolean }) => {
    return await planForPath(path, opts);
  });

  ipcMain.handle(
    'installer:run',
    async (evt, payload: { path: InstallPath; plan: InstallPlan }) => {
      const sender = evt.sender;
      return await runPath(payload.path, payload.plan, (p) => sender.send('installer:progress', p));
    },
  );

  ipcMain.handle('provider:validate', async (_evt, _providerId: string, apiKey: string) => {
    // MVP: 只做最小校验，避免阻塞演示。后续可在这里接入真实 provider ping。
    if (!apiKey || !apiKey.trim()) return { valid: false, error: 'API Key 不能为空' };
    if (apiKey.trim().length < 8) return { valid: false, error: 'API Key 看起来太短' };
    return { valid: true };
  });

  ipcMain.handle('shell:openExternal', async (_evt, url: string) => {
    return await shell.openExternal(url);
  });

  ipcMain.handle('app:platform', () => process.platform);
  ipcMain.handle('app:version', () => app.getVersion());
  ipcMain.handle('app:quit', () => app.quit());
}
