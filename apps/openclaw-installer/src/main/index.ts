/**
 * Lobster Installer - Main Process Entry
 * 企业 AI Agent 安装桥主进程入口
 */
import { app, BrowserWindow, shell } from 'electron';
import { join } from 'path';
import { registerIpcHandlers } from './ipc-handlers';

// 保持全局引用防止垃圾回收
let mainWindow: BrowserWindow | null = null;

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
 * 创建主窗口
 */
function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 900,
    height: 680,
    minWidth: 800,
    minHeight: 600,
    icon: getAppIcon(),
    title: 'Lobster 安装桥',
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
  console.log('[Lobster Installer] Application Starting');

  // 创建主窗口
  mainWindow = createWindow();

  // 注册 IPC 处理器
  registerIpcHandlers();

  // 窗口关闭处理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 注册 lobster:// 协议（支持网页一键唤起安装器）
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('lobster', process.execPath, [process.argv[1]!]);
  }
} else {
  app.setAsDefaultProtocolClient('lobster');
}

// 处理协议唤起
app.on('open-url', (_event, url) => {
  console.log('[Lobster Installer] Open URL:', url);
  if (!mainWindow) {
    mainWindow = createWindow();
  } else {
    mainWindow.focus();
  }
});

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

// 导出供测试使用
export { mainWindow };
