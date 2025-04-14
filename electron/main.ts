import {app, BrowserWindow, ipcMain} from 'electron';
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import '../src/backend/db/tables.ts'
import {getGroups, getItemsForUI} from "../src/backend/db/getters.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    minWidth: 900,
    minHeight: 650,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Hide menu bar
  win.setMenuBarVisibility(false)

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL).then(() => {
      if (!win) {
        throw new Error('"win" is not defined')
      }
    })
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html')).then(() => {
      if (!win) {
        throw new Error('"win" is not defined')
      }
    })
  }
}

function handleIpc(name: string, handler: (...args: any[]) => any) {
  ipcMain.handle(name, async (_event, ...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error(`Error in ${name}`, error);
      throw error;
    }
  });
}

handleIpc('getItemsForUI', getItemsForUI);
handleIpc('getGroups', getGroups);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);