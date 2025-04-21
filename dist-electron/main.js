import { app, BrowserWindow, ipcMain } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    width: 960,
    // 初始宽度
    height: 670,
    // 初始高度
    minWidth: 960,
    // 最小宽度
    minHeight: 670,
    // 最小高度
    title: "飞书",
    // 标题
    frame: false,
    // 无边框，以自定义标题栏结构
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs")
    }
  });
  win.setMenu(null);
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
  if (process.env.NODE_ENV === "development" || VITE_DEV_SERVER_URL) {
    win.webContents.openDevTools();
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(() => {
  createWindow();
  ipcMain.on("minimize-window", () => {
    console.log("最小化窗口");
    win == null ? void 0 : win.minimize();
  });
  ipcMain.on("maximize-window", () => {
    if (win == null ? void 0 : win.isMaximized()) {
      win == null ? void 0 : win.unmaximize();
    } else {
      win == null ? void 0 : win.maximize();
    }
  });
  ipcMain.on("close-window", () => {
    win == null ? void 0 : win.close();
  });
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
