/**
 * Tray Application Entry
 * 系统托盘常驻程序（安装完成后启动）
 * 
 * 注意：这是独立的入口点，安装完成后由主程序启动
 */
import { app, Tray, Menu } from 'electron';
import { join } from 'path';
import { existsSync } from 'node:fs';
import { GatewayManager } from './gateway-manager';

let tray: Tray | null = null;
let gatewayManager: GatewayManager | null = null;

function getIconPath(): string | undefined {
  const candidates = [
    app.isPackaged
      ? join(process.resourcesPath, 'resources', 'tray-icons', 'icon.png')
      : join(__dirname, '../../resources', 'tray-icons', 'icon.png'),
    // Fallback to app icon if tray icon is missing
    app.isPackaged
      ? join(process.resourcesPath, 'resources', 'icon.png')
      : join(__dirname, '../../resources', 'icon.png'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return undefined;
}

function createTrayMenu(): Menu {
  const status = gatewayManager?.getStatus();
  
  return Menu.buildFromTemplate([
    {
      label: 'OpenClaw Gateway',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: status?.running ? '✓ 运行中' : '✗ 已停止',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: status?.running ? '停止 Gateway' : '启动 Gateway',
      click: async () => {
        if (status?.running) {
          await gatewayManager?.stop();
        } else {
          await gatewayManager?.start();
        }
        updateTray();
      },
    },
    {
      label: '重启 Gateway',
      click: async () => {
        await gatewayManager?.restart();
        updateTray();
      },
    },
    { type: 'separator' },
    {
      label: '打开控制台',
      click: () => {
        if (status?.url) {
          require('electron').shell.openExternal(status.url);
        }
      },
    },
    {
      label: '查看日志',
      click: () => {
        const { homedir } = require('os');
        const logPath = join(homedir(), '.openclaw', 'logs');
        require('electron').shell.openPath(logPath);
      },
    },
    {
      label: '打开配置目录',
      click: () => {
        const { homedir } = require('os');
        const configPath = join(homedir(), '.openclaw');
        require('electron').shell.openPath(configPath);
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        gatewayManager?.stop();
        app.quit();
      },
    },
  ]);
}

function updateTray(): void {
  if (tray) {
    tray.setContextMenu(createTrayMenu());
  }
}

export function createTray(): void {
  const iconPath = getIconPath();
  if (!iconPath) {
    console.warn('[Tray] No icon found, skipping tray creation');
    return;
  }
  tray = new Tray(iconPath);
  tray.setToolTip('OpenClaw Gateway');
  tray.setContextMenu(createTrayMenu());

  tray.on('click', () => {
    tray?.popUpContextMenu();
  });
}

export async function initializeTray(): Promise<void> {
  gatewayManager = new GatewayManager();
  
  // 自动启动 Gateway
  try {
    await gatewayManager.start();
  } catch (error) {
    console.error('Failed to auto-start gateway:', error);
  }
  
  createTray();
}

// 如果直接运行 tray 入口
if (require.main === module) {
  app.whenReady().then(() => {
    void initializeTray();
  });
  
  app.on('window-all-closed', () => {
    // Tray 应用保持运行
  });
}
