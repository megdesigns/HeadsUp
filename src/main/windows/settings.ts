import { app, BrowserWindow } from 'electron'
import { join } from 'node:path'

let win: BrowserWindow | null = null

/** Opens (or focuses) the settings window. */
export function openSettings(): void {
  if (win && !win.isDestroyed()) {
    win.show()
    win.focus()
    return
  }

  win = new BrowserWindow({
    width: 1020,
    height: 696,
    minWidth: 900,
    minHeight: 620,
    resizable: true,
    maximizable: false,
    fullscreenable: false,
    title: 'HeadsUp',
    // macOS: hide the title bar and inset the real traffic lights into the
    // sidebar, so there's only one set of window controls.
    ...(process.platform === 'darwin'
      ? { titleBarStyle: 'hiddenInset' as const, trafficLightPosition: { x: 20, y: 20 } }
      : {}),
    backgroundColor: '#282b2b',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.on('ready-to-show', () => {
    win?.show()
    win?.focus()
    // Bring the app forward so the window is usable even from another Space/app.
    if (process.platform === 'darwin') app.focus({ steal: true })
  })
  win.on('closed', () => {
    win = null
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    void win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/settings/index.html`)
  } else {
    void win.loadFile(join(__dirname, '../renderer/settings/index.html'))
  }
}
