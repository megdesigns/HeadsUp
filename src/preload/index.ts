import { contextBridge, ipcRenderer } from 'electron'

export type Flight = {
  message: string
  durationMs: number
  sound?: boolean
  soundPack?: string
  theme?: string
  head?: string
  color?: string
  font?: string
}

// Single, minimal API exposed to both the overlay and settings renderers.
contextBridge.exposeInMainWorld('headsup', {
  // Overlay
  onFlight: (cb: (flight: Flight) => void): (() => void) => {
    const listener = (_event: unknown, flight: Flight): void => cb(flight)
    ipcRenderer.on('flight:start', listener)
    return () => ipcRenderer.removeListener('flight:start', listener)
  },
  // Settings
  getPrefs: () => ipcRenderer.invoke('prefs:get'),
  setPrefs: (patch: unknown) => ipcRenderer.invoke('prefs:set', patch),
  manualList: () => ipcRenderer.invoke('manual:list'),
  manualSave: (item: unknown) => ipcRenderer.invoke('manual:save', item),
  manualRemove: (id: string) => ipcRenderer.invoke('manual:remove', id),
  manualComplete: (id: string, completed: boolean) =>
    ipcRenderer.invoke('manual:complete', id, completed),
  testFlight: () => ipcRenderer.invoke('flight:test')
})
