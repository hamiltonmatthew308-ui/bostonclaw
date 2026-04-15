/**
 * IPC Handlers (r03)
 *
 * 仅保留向导所需的最小 IPC：installer:* + provider:validate + shell/app 基础能力。
 * 旧版 modules/* 已不存在，避免再次出现“导入缺失文件导致主进程启动失败”。
 */
import { app, dialog, ipcMain, shell } from 'electron';

import type { InstallPath, InstallPlan } from '../shared/types/installer';
import { checkEnvForPath, planForPath, runPath } from './engine';

export function registerIpcHandlers(): void {
  ipcMain.handle('installer:checkEnv', async (_evt, path: InstallPath) => {
    return await checkEnvForPath(path);
  });

  ipcMain.handle('installer:plan', async (_evt, path: InstallPath, opts?: { experimentalWinNative?: boolean }) => {
    return await planForPath(path, opts);
  });

  let runMutex = false;
  ipcMain.handle(
    'installer:run',
    async (evt, payload: { path: InstallPath; plan: InstallPlan; runId?: string }) => {
      if (runMutex) {
        return { success: false, message: '已有安装任务正在运行，请等待完成', nextAction: 'none' };
      }
      runMutex = true;
      const sender = evt.sender;
      try {
        return await runPath(payload.path, payload.plan, (p) =>
          sender.send('installer:progress', { ...p, runId: payload.runId }),
        );
      } finally {
        runMutex = false;
      }
    },
  );

  ipcMain.handle('provider:validate', async (_evt, _providerId: string, apiKey: string) => {
    // MVP: 只做最小校验，避免阻塞演示。后续可在这里接入真实 provider ping。
    if (!apiKey || !apiKey.trim()) return { valid: false, error: 'API Key 不能为空' };
    if (apiKey.trim().length < 8) return { valid: false, error: 'API Key 看起来太短' };
    return { valid: true };
  });

  ipcMain.handle('dialog:openFile', async (_evt, options?: { title?: string; filters?: Electron.FileFilter[] }) => {
    const result = await dialog.showOpenDialog({
      title: options?.title,
      filters: options?.filters,
      properties: ['openFile'],
    });
    return { canceled: result.canceled, filePaths: result.filePaths };
  });

  ipcMain.handle('shell:openExternal', async (_evt, url: string) => {
    return await shell.openExternal(url);
  });

  ipcMain.handle('app:platform', () => process.platform);
  ipcMain.handle('app:version', () => app.getVersion());
  ipcMain.handle('app:quit', () => app.quit());
}
