/**
 * Bostonclaw Installer - Main Process Entry
 * 企业 AI Agent 安装桥主进程入口
 */
import { app, BrowserWindow, shell } from 'electron';
import { join } from 'path';
import { existsSync, readFileSync } from 'node:fs';
import { registerIpcHandlers } from './ipc-handlers';

// 保持全局引用防止垃圾回收
let mainWindow: BrowserWindow | null = null;

// Deep link 排队：如果窗口还没加载完，先存起来
let pendingDeepLink: { path: string; auto: boolean } | null = null;

/**
 * 获取应用图标路径
 */
function getAppIcon(): string | undefined {
  if (process.platform === 'darwin') return undefined;
  const iconsDir = app.isPackaged
    ? join(process.resourcesPath, 'resources')
    : join(__dirname, '../../resources');
  return process.platform === 'win32'
    ? join(iconsDir, 'icon.ico')
    : join(iconsDir, 'icon.png');
}

/**
 * 处理 deep link URL：bostonclaw://install?path=hermes&auto=1
 */
function handleDeepLink(url: string): void {
  try {
    const parsed = new URL(url);
    const path = parsed.searchParams.get('path');
    const auto = parsed.searchParams.get('auto') === '1';

    if (!path) return;

    const payload = { path, auto };

    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents.isLoading() === false) {
      mainWindow.webContents.send('deep-link:trigger', payload);
    } else {
      pendingDeepLink = payload;
    }

    console.log(`[Bostonclaw] Deep link received: path=${path}, auto=${auto}`);
  } catch (e) {
    console.warn('[Bostonclaw] Failed to parse deep link URL:', url, e);
  }
}

/**
 * 创建主窗口
 */
function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 960,
    height: 820,
    minWidth: 800,
    minHeight: 600,
    icon: getAppIcon(),
    title: 'Bostonclaw 安装器',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    show: false,
    center: true,
  });

  // 外部链接处理
  win.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        shell.openExternal(url);
      }
    } catch {
      console.warn(`Blocked openExternal for malformed URL: ${url}`);
    }
    return { action: 'deny' };
  });

  // 页面加载完成后，发送排队的 deep link
  win.webContents.on('did-finish-load', () => {
    if (pendingDeepLink) {
      win.webContents.send('deep-link:trigger', pendingDeepLink);
      pendingDeepLink = null;
    }
  });

  // 加载页面
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(join(__dirname, '../../dist/index.html'));
  }

  win.once('ready-to-show', () => {
    win.show();
  });

  return win;
}

/**
 * 初始化应用
 */
async function initialize(): Promise<void> {
  console.log('[Bostonclaw Installer] Application Starting');

  // 创建主窗口
  mainWindow = createWindow();

  // 注册 IPC 处理器
  registerIpcHandlers();

  // 窗口关闭处理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 注册 bostonclaw:// 协议（支持网页一键唤起安装器）
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('bostonclaw', process.execPath, [process.argv[1]!]);
  }
} else {
  app.setAsDefaultProtocolClient('bostonclaw');
}

// macOS: 处理协议唤起
app.on('open-url', (_event, url) => {
  console.log('[Bostonclaw] Open URL:', url);
  if (!mainWindow) {
    mainWindow = createWindow();
  } else {
    mainWindow.focus();
  }
  handleDeepLink(url);
});

// Windows: 处理第二个实例（协议唤起时 Windows 会启动新实例）
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  // 如果拿到的是协议 URL 而不是正常启动，交给已有实例处理
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    if (!mainWindow) {
      mainWindow = createWindow();
    } else {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    // 在 argv 中找 bostonclaw:// URL
    const url = argv.find((a) => a.startsWith('bostonclaw://'));
    if (url) handleDeepLink(url);
  });
}

// 应用生命周期
app.whenReady().then(() => {
  void initialize().catch((error) => {
    console.error('Application initialization failed:', error);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  try {
    const pidPath = join(app.getPath('userData'), 'runtime', 'gateway.pid');
    if (existsSync(pidPath)) {
      const pid = Number(readFileSync(pidPath, 'utf-8').trim());
      if (pid) {
        try {
          process.kill(pid, 'SIGTERM');
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // ignore
  }
});

// 导出供测试使用
export { mainWindow };
