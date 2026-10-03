import { app, globalShortcut } from 'electron'
import { createOverlayWindow, flyAcross } from './windows/overlay'
import { openSettings } from './windows/settings'
import { createTray } from './tray'
import { registerIpc } from './ipc'
import { getPrefs } from './store'
import { startScheduler } from './scheduler'

// Only allow a single packaged HeadsUp instance. In dev, Electron can leave a stale
// generic lock behind, so do not let that block launching from the repo.
if (app.isPackaged && !app.requestSingleInstanceLock()) {
  app.quit()
}

// Safety nets: never let a stray error tear the whole app down.
process.on('uncaughtException', (err) => console.error('[uncaughtException]', err))
process.on('unhandledRejection', (err) => console.error('[unhandledRejection]', err))
app.on('render-process-gone', (_e, _wc, d) => console.error('[render-process-gone]', d))
app.on('child-process-gone', (_e, d) => console.error('[child-process-gone]', d))

// Re-opening the app (second launch, or clicking it again) brings the control window forward.
app.on('second-instance', () => openSettings())

/** A test flight, from the tray menu or ⌘⇧D. */
function sendTestFlight(): void {
  const prefs = getPrefs()
  flyAcross({
    message: 'Manual reminder test flight',
    durationMs: 9000,
    sound: prefs.soundEnabled,
    soundPack: prefs.soundPack,
    theme: prefs.theme,
    head: prefs.flierHead,
    color: prefs.flierColor,
    font: prefs.font
  })
}

app.whenReady().then(async () => {
  // HeadsUp is a regular app: it shows in the Dock and Cmd+Tab. (It also keeps
  // a menu-bar icon for quick access, and stays running in the background.)
  // Lock the Dock icon on so showing the overlay never drops us to accessory mode.
  if (process.platform === 'darwin') app.dock?.show()

  registerIpc()

  // Honour the saved "launch at login" preference (only works once packaged).
  if (app.isPackaged) {
    try {
      app.setLoginItemSettings({ openAtLogin: getPrefs().launchAtLogin })
    } catch {
      /* not permitted in some environments */
    }
  }

  createOverlayWindow()
  createTray(sendTestFlight, openSettings)
  globalShortcut.register('CommandOrControl+Shift+D', sendTestFlight)

  // Show the control window when the app opens.
  openSettings()

  // Watch manually scheduled reminders.
  startScheduler()
})

// Re-open the control window when the app is activated (macOS).
app.on('activate', () => openSettings())

// Stay alive in the background even when no window is visible.
app.on('window-all-closed', () => {
  // Intentionally do nothing — the app lives in the tray / menu bar.
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
