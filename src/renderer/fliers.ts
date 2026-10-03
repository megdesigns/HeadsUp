// The flier is composed: a character/avatar head placed on a coloured plane.
export type Head = { id: string; name: string; free: boolean; sound: string }
export type PlaneColor = { id: string; name: string; free: boolean }

export const HEADS: Head[] = [
  { id: 'duck', name: 'Duck', free: true, sound: 'quack' },
  { id: 'mia', name: 'Mia', free: true, sound: 'ring' },
  { id: 'cat', name: 'Cat', free: true, sound: 'quack' },
  { id: 'frog', name: 'Frog', free: true, sound: 'quack' },
  { id: 'fox', name: 'Fox', free: true, sound: 'quack' }
]

export const PLANE_COLORS: PlaneColor[] = [{ id: 'yellow', name: 'Yellow', free: true }]

export function headById(id: string | undefined): Head {
  return HEADS.find((h) => h.id === id) ?? HEADS[0]
}
export function colorById(id: string | undefined): PlaneColor {
  return PLANE_COLORS.find((c) => c.id === id) ?? PLANE_COLORS[0]
}
