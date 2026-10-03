// Shared ambient types for the renderer side (the API exposed by the preload).
export {}

declare global {
  type Flight = {
    message: string
    durationMs: number
    sound?: boolean
    soundPack?: string
    theme?: string
    head?: string
    color?: string
    font?: string
  }

  type Prefs = {
    soundEnabled: boolean
    launchAtLogin: boolean
    targetDisplay: 'cursor' | 'primary'
    theme: string
    font: string
    soundPack: string
    flierHead: string
    flierColor: string
  }

  type ManualItem = {
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
  type ManualItemInput = Partial<ManualItem> & Pick<ManualItem, 'kind' | 'title'>

  interface HeadsUpApi {
    onFlight: (cb: (flight: Flight) => void) => () => void
    getPrefs: () => Promise<Prefs>
    setPrefs: (patch: Partial<Prefs>) => Promise<Prefs>
    manualList: () => Promise<ManualItem[]>
    manualSave: (item: ManualItemInput) => Promise<ManualItem[]>
    manualRemove: (id: string) => Promise<ManualItem[]>
    manualComplete: (id: string, completed: boolean) => Promise<ManualItem[]>
    testFlight: () => Promise<boolean>
  }

  interface Window {
    headsup: HeadsUpApi
  }
}
