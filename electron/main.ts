import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import Store from 'electron-store'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import * as fs from 'fs'
import * as https from 'https'
import * as http from 'http'

const store = new Store()
console.log('Electron Store Path:', store.path)

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// --- 窗口 ---
let mainWin: BrowserWindow | null // 主窗口
let loginWin: BrowserWindow | null // 登录窗口

// --- 创建登录窗口 ---
function createLoginWindow() {
  console.log('创建登录窗口')
  loginWin = new BrowserWindow({
    width: 350, // 初始宽度
    height: 500, // 初始高度
    resizable: false, // 不可调整大小
    maximizable: false, // 不可最大化
    fullscreenable: false, // 不可全屏
    frame: false, // 无边框，以自定义标题栏结构
    titleBarStyle: 'hidden', // 隐藏标题栏
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true, // 上下文隔离
    },
  })

  loginWin.setMenu(null) // 取消工具栏

  // 加载登录页面路由
  if (VITE_DEV_SERVER_URL) {
    // 开发环境，加载 Vite dev server URL，并指定路由为 /login
    loginWin.loadURL(`${VITE_DEV_SERVER_URL}/#/login`) // 假设使用 HashRouter
    loginWin.webContents.openDevTools() // 在开发环境下自动打开 DevTools
  } else {
    // 生产环境，加载打包后的 index.html，并指定 hash
    loginWin.loadFile(path.join(RENDERER_DIST, 'index.html'), {
      hash: '/login',
    })
  }

  loginWin.on('ready-to-show', () => {
    loginWin?.show()
  })

  loginWin.on('closed', () => {
    console.log('Main: Login window closed.')
    loginWin = null
    // 如果主窗口也关闭了 (或从未打开)，则退出应用
    if (!mainWin) {
      console.log('Main: Login window closed and no main window, quitting app.')
      app.quit()
    }
  })
}

// --- 创建主窗口 ---
function createMainWindow() {
  mainWin = new BrowserWindow({
    width: 1260, // 初始宽度
    height: 670, // 初始高度
    minWidth: 960, // 最小宽度
    minHeight: 670, // 最小高度
    title: '飞信', // 标题
    frame: false, // 无边框，以自定义标题栏结构
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // 取消工具栏
  mainWin.setMenu(null)

  // Test active push message to Renderer-process.
  mainWin.webContents.on('did-finish-load', () => {
    mainWin?.webContents.send(
      'main-process-message',
      new Date().toLocaleString()
    )
  })

  if (VITE_DEV_SERVER_URL) {
    mainWin.loadURL(VITE_DEV_SERVER_URL)
    mainWin.webContents.openDevTools() // 在开发环境下自动打开 DevTools
  } else {
    // mainWin.loadFile('dist/index.html')
    mainWin.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  mainWin.on('ready-to-show', () => {
    mainWin?.show()
  })

  mainWin.on('closed', () => {
    console.log('Main: Main window closed.')
    mainWin = null
  })

  // (可选) 处理新窗口打开行为，例如在新窗口中打开外部链接
  mainWin.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' } // 阻止在 Electron 内部打开新窗口
  })
}

// --- 处理窗口关闭事件 ---
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    mainWin = null
  }
})

// --- 处理激活事件 ---
app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    // --- 修改：始终创建登录窗口 ---
    console.log('Main (Activate): No windows open, creating login window.')
    createLoginWindow()
    // --- 结束修改 ---
  } else {
    // 如果已有窗口，聚焦最前面的那个 (可能是主窗口或登录窗口)
    const win = BrowserWindow.getFocusedWindow() || mainWin || loginWin
    win?.focus()
  }
})

// --- 当应用准备就绪时 ---
app.whenReady().then(() => {
  console.log('Main: App ready.')
  // 设置 Windows 上的 AppUserModelId
  electronApp.setAppUserModelId('com.yourcompany.yourappname') // 建议修改为你的应用ID

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // ----------  IPC 监视器 ----------

  // 登录成功处理
  ipcMain.on('login-success', (_, token) => {
    console.log('Main: Received login-success signal.')
    if (token) {
      store.set('authToken', token) // 使用 electron-store 存储 Token
      console.log('Main: Token stored.')
    } else {
      console.warn('Main: Received login-success signal without token.')
    }

    if (loginWin) {
      console.log('Main: Closing login window.')
      loginWin.close() // 关闭登录窗口
    }
    if (!mainWin) {
      // 确保主窗口不存在时才创建
      console.log('Main: Creating main window after login.')
      createMainWindow() // 创建主窗口
    } else {
      console.log('Main: Main window already exists, focusing.')
      mainWin.focus() // 如果已存在，则聚焦
    }
  })

  // 强制登出处理 (例如 Token 失效)
  ipcMain.on('force-logout', () => {
    console.log('Main: Received force-logout signal.')
    store.delete('authToken') // 清除 token
    if (mainWin) {
      console.log('Main: Closing main window due to force-logout.')
      mainWin.close() // 关闭主窗口
      mainWin = null
    }
    if (!loginWin) {
      // 确保登录窗口不存在时才创建
      console.log('Main: Creating login window due to force-logout.')
      createLoginWindow() // 打开登录窗口
    } else {
      loginWin.focus() // 如果已存在，则聚焦
    }
  })

  // 登录窗口控制 (使用新的 channel name)
  ipcMain.on('minimize-login-window', () => {
    loginWin?.minimize()
  })
  ipcMain.on('close-login-window', () => {
    loginWin?.close()
  })

  // 主窗口控制 (保留你原来的 channel name)
  ipcMain.on('minimize-window', () => {
    console.log('Main: Minimizing main window')
    mainWin?.minimize()
  })
  ipcMain.on('maximize-window', () => {
    if (mainWin?.isMaximized()) {
      console.log('Main: Unmaximizing main window')
      mainWin?.unmaximize()
    } else {
      console.log('Main: Maximizing main window')
      mainWin?.maximize()
    }
  })
  ipcMain.on('close-window', () => {
    console.log('Main: Closing main window')
    mainWin?.close()
  })
  // ------------------------------------------

  // --- 启动逻辑：始终创建登录窗口 ---
  createLoginWindow()
  // ------------------------------------------

  // 选择文件夹
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    return result
  })

  // 保存文件
  ipcMain.handle('save-file', async (_, args: { url: string; fileName: string; saveType: 'default' | 'saveAs'; fileType: 'file' | 'image' }) => {
    try {
      const { url, fileName, saveType, fileType } = args;
      
      // 获取保存路径
      let savePath: string;
      if (saveType === 'default') {
        // 使用默认路径
        const defaultPath = store.get(`${fileType}Path`) as string;
        if (!defaultPath) {
          throw new Error(`请先在设置中配置${fileType === 'file' ? '文件' : '图片'}保存路径`);
        }
        savePath = path.join(defaultPath, fileName);
      } else {
        // 让用户选择保存位置
        const result = await dialog.showSaveDialog({
          defaultPath: fileName,
          filters: fileType === 'image' 
            ? [{ name: '图片', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }]
            : [{ name: '所有文件', extensions: ['*'] }]
        });
        
        if (result.canceled || !result.filePath) {
          return { success: false, error: '用户取消保存' };
        }
        savePath = result.filePath;
      }

      // 下载文件
      return new Promise((resolve) => {
        const protocol = url.startsWith('https') ? https : http;
        protocol.get(url, (response) => {
          if (response.statusCode !== 200) {
            resolve({ success: false, error: `下载失败: ${response.statusCode}` });
            return;
          }

          const file = fs.createWriteStream(savePath);
          response.pipe(file);

          file.on('finish', () => {
            file.close();
            resolve({ success: true });
          });

          file.on('error', (err) => {
            fs.unlink(savePath, () => {});
            resolve({ success: false, error: err.message });
          });
        }).on('error', (err) => {
          resolve({ success: false, error: err.message });
        });
      });
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // 使用默认应用打开文件
  ipcMain.handle('open-file', async (_, args: { filePath: string }) => {
    try {
      // 首先下载文件到临时目录
      const tempFile = path.join(app.getPath('temp'), path.basename(args.filePath));
      
      // 下载文件
      await new Promise<void>((resolve, reject) => {
        const protocol = args.filePath.startsWith('https') ? https : http;
        protocol.get(args.filePath, (response) => {
          if (response.statusCode !== 200) {
            reject(new Error(`下载失败: ${response.statusCode}`));
            return;
          }

          const file = fs.createWriteStream(tempFile);
          response.pipe(file);

          file.on('finish', () => {
            file.close();
            resolve();
          });

          file.on('error', (err) => {
            fs.unlink(tempFile, () => {});
            reject(err);
          });
        }).on('error', reject);
      });

      // 在 Windows 上使用 shell.openExternal 来显示"打开方式"对话框
      if (process.platform === 'win32') {
        await shell.openExternal(`shell:AppsFolder\\Windows.SystemApps.OpenWith_cw5n1h2txyewy!App ${tempFile}`);
      } else {
        // 在其他平台上使用默认的打开方式
        await shell.openPath(tempFile);
      }
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // 在文件夹中显示
  ipcMain.handle('show-in-folder', async (_, args: { filePath: string }) => {
    try {
      await shell.showItemInFolder(args.filePath);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // 处理 electron-store 操作
  ipcMain.handle('get-store-value', (event, key: string) => {
    return store.get(key);
  });

  ipcMain.handle('set-store-value', (event, key: string, value: any) => {
    store.set(key, value);
    return true;
  });

  // 获取系统下载路径
  ipcMain.handle('get-downloads-path', () => {
    return app.getPath('downloads');
  });

  // 确保目录存在
  ipcMain.handle('ensure-dir', async (_, dirPath: string) => {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
      return true;
    } catch (error) {
      console.error('创建目录失败:', error);
      return false;
    }
  });
})
