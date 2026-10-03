import { app, ipcMain } from 'electron'
import { randomUUID } from 'node:crypto'
import {
  getPrefs,
  setPrefs,
  type Prefs,
  type ManualItem,
  loadManualItems,
  removeManualItem,
  upsertManualItem
} from './store'
import { flyAcross } from './windows/overlay'
import { startScheduler } from './scheduler'

type ManualItemInput = Partial<ManualItem> & Pick<ManualItem, 'kind' | 'title'>

/** Wires the settings renderer to the main process. */
export function registerIpc(): void {
  ipcMain.handle('prefs:get', () => getPrefs())

  ipcMain.handle('prefs:set', (_e, patch: Partial<Prefs>) => {
    const prefs = setPrefs(patch)
    if (patch.launchAtLogin !== undefined && app.isPackaged) {
      try {
        app.setLoginItemSettings({ openAtLogin: patch.launchAtLogin })
      } catch {
        /* ignore: not permitted in dev / sandboxed runs */
      }
    }
    return prefs
  })

  // --- Manual reminders ---
  ipcMain.handle('manual:list', () => loadManualItems())

  ipcMain.handle('manual:save', (_e, input: ManualItemInput) => {
    const now = Date.now()
    const previous = input.id ? loadManualItems().find((item) => item.id === input.id) : null
    const dueAt = typeof input.dueAt === 'number' && Number.isFinite(input.dueAt) ? input.dueAt : null
    const item: ManualItem = {
      id: input.id ?? randomUUID(),
      kind: 'reminder',
      title: input.title.trim(),
      note: input.note?.trim() ?? '',
      dueAt,
      project: input.project?.trim() || 'Reminders',
      tags: Array.isArray(input.tags) ? input.tags.map((tag) => tag.trim()).filter(Boolean) : [],
      completed: Boolean(input.completed),
      createdAt: previous?.createdAt ?? now,
      firedAt: previous?.dueAt === dueAt ? (previous?.firedAt ?? null) : null
    }
    if (!item.title) throw new Error('Add a title first.')
    const items = upsertManualItem(item)
    startScheduler()
    return items
  })

  ipcMain.handle('manual:remove', (_e, id: string) => removeManualItem(id))

  ipcMain.handle('manual:complete', (_e, id: string, completed: boolean) => {
    const items = loadManualItems()
    const item = items.find((it) => it.id === id)
    if (item) {
      item.completed = completed
      upsertManualItem(item)
    }
    return loadManualItems()
  })

  ipcMain.handle('flight:test', () => {
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
    return true
  })
}
