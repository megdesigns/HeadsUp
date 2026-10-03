import {
  getPrefs,
  loadManualItems,
  saveManualItems,
  type ManualItem
} from './store'
import { flyAcross } from './windows/overlay'

let tickTimer: NodeJS.Timeout | null = null

const TICK_MS = 15_000
const FIRE_WINDOW_MS = 90_000

export function startScheduler(): void {
  stopScheduler()
  tick()
  tickTimer = setInterval(tick, TICK_MS)
}

export function stopScheduler(): void {
  if (tickTimer) clearInterval(tickTimer)
  tickTimer = null
}

export function getUpcoming(): ManualItem[] {
  const now = Date.now()
  return loadManualItems()
    .filter((item) => !item.completed && item.dueAt !== null && item.dueAt >= now)
    .sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0))
}

function tick(): void {
  const prefs = getPrefs()
  const now = Date.now()
  const items = loadManualItems()
  let changed = false

  for (const item of items) {
    if (item.completed || item.firedAt || item.dueAt === null) continue
    const due = now >= item.dueAt && now < item.dueAt + FIRE_WINDOW_MS
    if (!due) continue

    item.firedAt = now
    changed = true
    flyAcross({
      message: flightMessage(item),
      durationMs: 9000,
      sound: prefs.soundEnabled,
      soundPack: prefs.soundPack,
      theme: prefs.theme,
      head: prefs.flierHead,
      color: prefs.flierColor,
      font: prefs.font
    })
  }

  if (changed) saveManualItems(items)
}

function flightMessage(item: ManualItem): string {
  return item.title
}
