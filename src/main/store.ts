import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export type Prefs = {
  soundEnabled: boolean
  launchAtLogin: boolean
  targetDisplay: 'cursor' | 'primary'
  theme: string
  font: string
  soundPack: string // which signature sound plays mid-flight
  flierHead: string // character head id
  flierColor: string // plane colour id
}

export type ManualItem = {
  id: string
  kind: 'reminder'
  title: string
  note: string
  dueAt: number | null
  project: string
  tags: string[]
  completed: boolean
  createdAt: number
  firedAt: number | null
}

const DEFAULT_PREFS: Prefs = {
  soundEnabled: true,
  launchAtLogin: false,
  targetDisplay: 'cursor',
  theme: 'striped',
  font: 'system',
  soundPack: 'quack',
  flierHead: 'duck',
  flierColor: 'yellow'
}

function dataDir(): string {
  const dir = app.getPath('userData')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}
const prefsPath = (): string => join(dataDir(), 'prefs.json')
const manualItemsPath = (): string => join(dataDir(), 'manual-items.json')

let cache: Prefs | null = null

export function getPrefs(): Prefs {
  if (cache) return cache
  try {
    if (existsSync(prefsPath())) {
      const raw = JSON.parse(readFileSync(prefsPath(), 'utf8'))
      cache = { ...DEFAULT_PREFS, ...raw }
    } else {
      cache = { ...DEFAULT_PREFS }
    }
  } catch {
    cache = { ...DEFAULT_PREFS }
  }
  return cache as Prefs
}

export function setPrefs(patch: Partial<Prefs>): Prefs {
  const next: Prefs = { ...getPrefs(), ...patch }
  cache = next
  try {
    writeFileSync(prefsPath(), JSON.stringify(next, null, 2), 'utf8')
  } catch {
    /* preferences are best-effort */
  }
  return next
}

// --- Manual reminders -----------------------------------------------------------

function normalizeManualItem(raw: Partial<ManualItem>): ManualItem | null {
  if (!raw.id || !raw.title) return null
  return {
    id: String(raw.id),
    kind: 'reminder',
    title: String(raw.title),
    note: raw.note ? String(raw.note) : '',
    dueAt: typeof raw.dueAt === 'number' ? raw.dueAt : null,
    project: raw.project ? String(raw.project) : 'Reminders',
    tags: Array.isArray(raw.tags) ? raw.tags.map(String).filter(Boolean) : [],
    completed: Boolean(raw.completed),
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
    firedAt: typeof raw.firedAt === 'number' ? raw.firedAt : null
  }
}

export function loadManualItems(): ManualItem[] {
  try {
    if (!existsSync(manualItemsPath())) return []
    const raw = JSON.parse(readFileSync(manualItemsPath(), 'utf8')) as unknown
    if (!Array.isArray(raw)) return []
    return raw
      .map((item) => normalizeManualItem(item as Partial<ManualItem>))
      .filter((item): item is ManualItem => item !== null)
  } catch {
    return []
  }
}

export function saveManualItems(items: ManualItem[]): ManualItem[] {
  try {
    writeFileSync(manualItemsPath(), JSON.stringify(items, null, 2), 'utf8')
  } catch {
    /* manual items are best-effort */
  }
  return items
}

export function upsertManualItem(item: ManualItem): ManualItem[] {
  const items = loadManualItems()
  const index = items.findIndex((it) => it.id === item.id)
  if (index >= 0) items[index] = item
  else items.unshift(item)
  return saveManualItems(items)
}

export function removeManualItem(id: string): ManualItem[] {
  return saveManualItems(loadManualItems().filter((item) => item.id !== id))
}
