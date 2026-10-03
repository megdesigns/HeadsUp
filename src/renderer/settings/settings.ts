import { planeBaseUrl, headUrl, BLADE_URL } from '../flier-assets'
import { HEADS } from '../fliers'
import { THEMES, themeById } from '../themes'
import { playSound } from '../sounds'

const q = window.headsup
const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T

const search = $<HTMLInputElement>('search')
const filterAll = $<HTMLButtonElement>('filter-all')
const filterToday = $<HTMLButtonElement>('filter-today')
const allCount = $('all-count')
const todayCount = $('today-count')
const completedCount = $('completed-count')
const viewTitle = $('view-title')
const contentHead = $('content-head')
const listSection = $('list-section')
const projectsEl = $('projects')
const reminderList = $('reminder-list')
const clearCompleted = $<HTMLButtonElement>('clear-completed')
const openSettings = $<HTMLButtonElement>('open-settings')
const closeSettings = $<HTMLButtonElement>('close-settings')
const settingsPanel = $('settings-panel')
const bannerOptions = $('banner-options')
const avatarOptions = $('avatar-options')
const editor = $('editor')
const editorKindLabel = $('editor-kind-label')
const cancelEdit = $<HTMLButtonElement>('cancel-edit')
const itemTitle = $<HTMLInputElement>('item-title')
const itemDue = $<HTMLInputElement>('item-due')
const itemProject = $<HTMLInputElement>('item-project')
const itemNote = $<HTMLTextAreaElement>('item-note')
const saveItem = $<HTMLButtonElement>('save-item')
const testFlight = $<HTMLButtonElement>('test-flight')
const formError = $('form-error')

let items: ManualItem[] = []
let prefs: Prefs | null = null
let editingId: string | null = null
let activeFilter: 'all' | 'today' = 'all'
let audioCtx: AudioContext | null = null

/** Plays an avatar's signature sound so the choice can be heard. */
function previewSound(id: string): void {
  try {
    if (!audioCtx) audioCtx = new AudioContext()
    if (audioCtx.state === 'suspended') void audioCtx.resume()
    playSound(audioCtx, id)
  } catch {
    // Preview is a nice-to-have.
  }
}

function showSettings(open: boolean): void {
  settingsPanel.classList.toggle('hidden', !open)
  editor.classList.toggle('hidden', open)
  listSection.classList.toggle('hidden', open)
  contentHead.classList.toggle('hidden', open)
  openSettings.classList.toggle('active', open)
  if (open) {
    filterAll.classList.remove('active')
    filterToday.classList.remove('active')
  } else {
    render()
  }
}

function startOfToday(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function endOfToday(): number {
  return startOfToday() + 24 * 60 * 60 * 1000
}

function toInputDate(value: number | null): string {
  if (!value) return ''
  const d = new Date(value)
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function fromInputDate(value: string): number | null {
  if (!value) return null
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : null
}

function formatDue(value: number | null): string {
  if (!value) return 'No flight time set'
  const d = new Date(value)
  const todayStart = startOfToday()
  const tomorrowStart = todayStart + 24 * 60 * 60 * 1000
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (value >= todayStart && value < tomorrowStart) return `Today, ${time}`
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`
}

function isToday(item: ManualItem): boolean {
  return item.dueAt !== null && item.dueAt >= startOfToday() && item.dueAt < endOfToday()
}

function filteredItems(): ManualItem[] {
  const term = search.value.trim().toLowerCase()
  return items
    .filter((item) => (activeFilter === 'today' ? isToday(item) : true))
    .filter((item) => {
      if (!term) return true
      return [item.title, item.note, item.project].join(' ').toLowerCase().includes(term)
    })
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      if (a.dueAt && b.dueAt) return a.dueAt - b.dueAt
      if (a.dueAt) return -1
      if (b.dueAt) return 1
      return b.createdAt - a.createdAt
    })
}

function resetEditor(): void {
  editingId = null
  editorKindLabel.textContent = 'Reminder'
  itemTitle.value = ''
  itemDue.value = ''
  itemProject.value = 'Reminders'
  itemNote.value = ''
  saveItem.textContent = 'Save Reminder'
  formError.classList.add('hidden')
}

function editItem(item: ManualItem): void {
  editingId = item.id
  editorKindLabel.textContent = 'Reminder'
  itemTitle.value = item.title
  itemDue.value = toInputDate(item.dueAt)
  itemProject.value = item.project
  itemNote.value = item.note
  saveItem.textContent = 'Update Reminder'
  formError.classList.add('hidden')
  editor.scrollIntoView({ block: 'nearest' })
  itemTitle.focus()
}

async function refresh(): Promise<void> {
  const [nextPrefs, nextItems] = await Promise.all([q.getPrefs(), q.manualList()])
  prefs = nextPrefs
  items = nextItems
  render()
  renderSettings()
}

function render(): void {
  const visible = filteredItems()
  const active = items.filter((item) => !item.completed)
  allCount.textContent = String(active.length)
  todayCount.textContent = String(active.filter(isToday).length)
  completedCount.textContent = String(items.filter((item) => item.completed).length)
  viewTitle.textContent = activeFilter === 'today' ? 'Today' : 'All'
  const settingsOpen = !settingsPanel.classList.contains('hidden')
  filterAll.classList.toggle('active', !settingsOpen && activeFilter === 'all')
  filterToday.classList.toggle('active', !settingsOpen && activeFilter === 'today')

  renderProjects()
  renderList(reminderList, visible)
}

function renderProjects(): void {
  const counts = new Map<string, number>()
  for (const item of items) {
    if (item.completed) continue
    counts.set(item.project, (counts.get(item.project) ?? 0) + 1)
  }
  const rows = Array.from(counts.entries())
  if (rows.length === 0) rows.push(['School', 0], ['Work', 0], ['Side Projects', 0], ['Important', 0])
  projectsEl.innerHTML = ''
  for (const [name, count] of rows.slice(0, 6)) {
    const row = document.createElement('button')
    row.className = 'project-row'
    row.type = 'button'
    row.innerHTML = `<span class="project-folder" aria-hidden="true"></span><span>${escapeHtml(name)}</span><span class="project-count">${count}</span>`
    row.addEventListener('click', () => {
      search.value = name
      render()
    })
    projectsEl.append(row)
  }
}

function renderList(container: HTMLElement, list: ManualItem[]): void {
  container.innerHTML = ''
  if (list.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'list-empty'
    empty.textContent = search.value.trim()
      ? 'Nothing matches your search.'
      : activeFilter === 'today'
        ? 'Nothing flying today.'
        : 'No reminders yet — add one above.'
    container.append(empty)
    return
  }
  for (const item of list) container.append(renderItem(item))
}

function renderItem(item: ManualItem): HTMLElement {
  const row = document.createElement('article')
  row.className = `item-row reminder-row${item.completed ? ' completed' : ''}`

  const check = document.createElement('button')
  check.className = 'item-check' + (item.completed ? ' done' : '')
  check.type = 'button'
  check.textContent = item.completed ? '✓' : ''
  check.setAttribute('aria-label', item.completed ? 'Mark incomplete' : 'Mark complete')
  check.addEventListener('click', async () => {
    items = await q.manualComplete(item.id, !item.completed)
    render()
  })

  const body = document.createElement('div')
  body.className = 'item-body'
  const title = document.createElement('p')
  title.className = 'item-title'
  title.textContent = item.title
  body.append(title)

  if (item.note) {
    const note = document.createElement('p')
    note.className = 'item-note'
    note.textContent = item.note
    body.append(note)
  }

  const meta = document.createElement('p')
  meta.className = 'item-meta' + (item.dueAt !== null && item.dueAt < Date.now() && !item.completed ? ' due-soon' : '')
  meta.textContent = formatDue(item.dueAt)
  body.append(meta)

  const actions = document.createElement('div')
  actions.className = 'item-actions'
  const edit = document.createElement('button')
  edit.type = 'button'
  edit.textContent = 'Edit'
  edit.addEventListener('click', () => editItem(item))
  const remove = document.createElement('button')
  remove.type = 'button'
  remove.textContent = 'Delete'
  remove.addEventListener('click', async () => {
    items = await q.manualRemove(item.id)
    render()
  })
  actions.append(edit, remove)
  row.append(check, body, actions)
  return row
}

function renderSettings(): void {
  if (!prefs) return
  bannerOptions.innerHTML = ''
  for (const theme of THEMES) {
    const button = document.createElement('button')
    button.className = 'option-card banner-choice' + (themeById(prefs.theme).id === theme.id ? ' selected' : '')
    button.type = 'button'
    button.style.setProperty('--stripe-a', theme.a)
    button.style.setProperty('--stripe-b', theme.b)
    button.dataset.pattern = theme.pattern
    button.innerHTML = `<span class="banner-sample"></span><strong>${theme.name}</strong>`
    button.addEventListener('click', async () => {
      prefs = await q.setPrefs({ theme: theme.id })
      renderSettings()
    })
    bannerOptions.append(button)
  }

  avatarOptions.innerHTML = ''
  for (const head of HEADS) {
    const button = document.createElement('button')
    button.className = 'option-card avatar-choice' + (prefs.flierHead === head.id ? ' selected' : '')
    button.type = 'button'
    const preview = document.createElement('span')
    preview.className = 'avatar-sample'
    preview.innerHTML = `<img class="avatar-plane" src="${planeBaseUrl(prefs.flierColor)}" alt="" /><img class="avatar-head" src="${headUrl(head.id)}" alt="" /><img class="avatar-blade" src="${BLADE_URL}" alt="" />`
    const label = document.createElement('strong')
    label.textContent = head.name
    button.append(preview, label)
    button.addEventListener('click', async () => {
      prefs = await q.setPrefs({ flierHead: head.id, soundPack: head.sound })
      previewSound(head.sound)
      renderSettings()
    })
    avatarOptions.append(button)
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;'
    }
    return entities[char] ?? char
  })
}

async function saveCurrentItem(): Promise<void> {
  formError.classList.add('hidden')
  try {
    const title = itemTitle.value.trim()
    const item: ManualItemInput = {
      id: editingId ?? undefined,
      kind: 'reminder',
      title,
      note: itemNote.value,
      dueAt: fromInputDate(itemDue.value),
      project: itemProject.value,
      tags: []
    }
    items = await q.manualSave(item)
    resetEditor()
    render()
  } catch (e) {
    formError.textContent = (e as Error).message
    formError.classList.remove('hidden')
  }
}

cancelEdit.addEventListener('click', resetEditor)
saveItem.addEventListener('click', () => void saveCurrentItem())
testFlight.addEventListener('click', () => void q.testFlight())
openSettings.addEventListener('click', () => showSettings(true))
closeSettings.addEventListener('click', () => showSettings(false))
search.addEventListener('input', render)
filterAll.addEventListener('click', () => {
  activeFilter = 'all'
  showSettings(false)
})
filterToday.addEventListener('click', () => {
  activeFilter = 'today'
  showSettings(false)
})
clearCompleted.addEventListener('click', async () => {
  for (const item of items.filter((it) => it.completed)) {
    items = await q.manualRemove(item.id)
  }
  render()
})

resetEditor()
void refresh()
