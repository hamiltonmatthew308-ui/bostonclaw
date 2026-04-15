/**
 * Preload Script - 安全地将主进程 API 暴露给渲染进程
 */
import { contextBridge, ipcRenderer } from 'electron';

// 有效的 IPC 通道列表
const VALID_INVOKE_CHANNELS = [
  // r03 installer wizard
  'installer:checkEnv',
  'installer:plan',
  'installer:run',
  // Provider 配置
  'provider:validate',
  // 系统
  'shell:openExternal',
  'dialog:openFile',
  'app:platform',
  'app:version',
  'app:quit',
];

const VALID_ON_CHANNELS = [
  'installer:progress',
  'deep-link:trigger',
];

// 暴露给渲染进程的 API
const electronAPI = {
  ipcRenderer: {
    invoke: (channel: string, ...args: unknown[]) => {
      if (VALID_INVOKE_CHANNELS.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
      throw new Error(`Invalid IPC channel: ${channel}`);
    },
    on: (channel: string, callback: (...args: unknown[]) => void) => {
      if (VALID_ON_CHANNELS.includes(channel)) {
        const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => {
          callback(...args);
        };
        ipcRenderer.on(channel, subscription);
        return () => {
          ipcRenderer.removeListener(channel, subscription);
        };
      }
      throw new Error(`Invalid IPC channel: ${channel}`);
    },
    once: (channel: string, callback: (...args: unknown[]) => void) => {
      if (VALID_ON_CHANNELS.includes(channel)) {
        ipcRenderer.once(channel, (_event, ...args) => callback(...args));
      }
    },
    off: (channel: string, callback?: (...args: unknown[]) => void) => {
      if (callback) {
        ipcRenderer.removeListener(channel, callback as any);
      } else {
        ipcRenderer.removeAllListeners(channel);
      }
    },
  },
  openExternal: (url: string) => {
    return ipcRenderer.invoke('shell:openExternal', url);
  },
  platform: process.platform,
  isDev: process.env.NODE_ENV === 'development' || !!process.env.VITE_DEV_SERVER_URL,
};

contextBridge.exposeInMainWorld('electron', electronAPI);

export type ElectronAPI = typeof electronAPI;
