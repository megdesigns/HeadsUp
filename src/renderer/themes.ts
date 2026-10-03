// Banner styles, shared by the overlay and settings.
export type Theme = {
  id: string
  name: string
  free: boolean
  a: string
  b: string
  text: string
  pattern: 'plain' | 'striped' | 'blueprint' | 'sunset'
}

export const THEMES: Theme[] = [
  {
    id: 'plain',
    name: 'Plain',
    free: true,
    a: '#ffffff',
    b: '#ffffff',
    text: '#1a1a1a',
    pattern: 'plain'
  },
  {
    id: 'striped',
    name: 'Striped',
    free: true,
    a: '#ffffff',
    b: '#ffe24d',
    text: '#1a1a1a',
    pattern: 'striped'
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    free: true,
    a: '#173f7a',
    b: '#2567b5',
    text: '#ffffff',
    pattern: 'blueprint'
  },
  {
    id: 'sunset',
    name: 'Sunset',
    free: true,
    a: '#ff9f45',
    b: '#ff4f81',
    text: '#1f1118',
    pattern: 'sunset'
  }
]

export function themeById(id: string | undefined): Theme {
  return THEMES.find((t) => t.id === id || (id === 'classic' && t.id === 'striped')) ?? THEMES[0]
}
