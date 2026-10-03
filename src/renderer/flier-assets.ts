// Flier image URLs (resolved & bundled by Vite). Shared by overlay + settings.
// All 1088×1088, aligned. The flier is composed as:
//   plane base (blade removed) + character head + spinning blade (shared).
import blade from './overlay/blade.svg'
// Bladeless base — used for the composed flier (so the blade can spin on top).
// Smooth vector art, so it stays sharp at any size.
import baseYellow from './overlay/plane-yellow-base.svg'
// Head, full-canvas (for composing) + tight thumbnail (for the head tile).
import headDuck from './overlay/head-duck.png'
import thumbDuck from './overlay/thumb-head-duck.png'
import headCat from './overlay/head-cat.svg'
import headFrog from './overlay/head-frog.svg'
import headFox from './overlay/head-fox.svg'
import headMia from './overlay/head-mia.svg'

export const BLADE_URL = blade

const PLANE_BASE_URL: Record<string, string> = {
  yellow: baseYellow
}
const HEAD_URL: Record<string, string> = {
  duck: headDuck,
  cat: headCat,
  frog: headFrog,
  fox: headFox,
  mia: headMia
}
const HEAD_THUMB_URL: Record<string, string> = {
  duck: thumbDuck,
  cat: headCat,
  frog: headFrog,
  fox: headFox,
  mia: headMia
}

export const planeBaseUrl = (id: string | undefined): string =>
  PLANE_BASE_URL[id ?? 'yellow'] ?? PLANE_BASE_URL.yellow
export const headUrl = (id: string | undefined): string => HEAD_URL[id ?? 'duck'] ?? HEAD_URL.duck
export const headThumbUrl = (id: string | undefined): string =>
  HEAD_THUMB_URL[id ?? 'duck'] ?? HEAD_THUMB_URL.duck
