import { useCallback } from 'react';
import type {
  InstallPath,
  EnvReport,
  InstallPlan,
  InstallProgress,
  RunResult,
} from '../../shared/types/installer';

export function useInstaller() {
  const checkEnv = useCallback(async (path: InstallPath): Promise<EnvReport> => {
    const result = await window.electron.ipcRenderer.invoke('installer:checkEnv', path);
    return result as EnvReport;
  }, []);

  const plan = useCallback(async (path: InstallPath, opts?: { experimentalWinNative?: boolean }): Promise<InstallPlan> => {
    const result = await window.electron.ipcRenderer.invoke('installer:plan', path, opts);
    return result as InstallPlan;
  }, []);

  const run = useCallback(
    async (
      path: InstallPath,
      plan: InstallPlan,
      onProgress: (p: InstallProgress) => void,
    ): Promise<RunResult> => {
      const runId = Math.random().toString(36).slice(2);
      const unsubscribe = window.electron.ipcRenderer.on('installer:progress', (p) => {
        const progress = p as InstallProgress;
        if (progress.runId && progress.runId !== runId) return;
        onProgress(progress);
      });

      try {
        const result = await window.electron.ipcRenderer.invoke('installer:run', { path, plan, runId });
        return result as RunResult;
      } finally {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        } else {
          window.electron.ipcRenderer.off('installer:progress');
        }
      }
    },
    [],
  );

  const openExternal = useCallback(async (url: string): Promise<void> => {
    await window.electron.ipcRenderer.invoke('shell:openExternal', url);
  }, []);

  return { checkEnv, plan, run, openExternal };
}
