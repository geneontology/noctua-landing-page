/**
 * Model state chip colours, copied from VPE's `features/gocam/data/stateColors.ts`
 * so a state looks the same on the landing page as in the editor. Keep the two
 * in step.
 */
interface StateColor {
  chip: string
  circle: string
}

const STATE_COLORS: Record<string, StateColor> = {
  development: {
    chip: 'bg-orange-100 text-amber-900 border-orange-300',
    circle: 'bg-orange-200 border-orange-300 text-amber-700',
  },
  production: {
    chip: 'bg-green-500/10 text-green-900 border-green-300',
    circle: 'bg-green-200 border-green-300 text-green-700',
  },
  review: {
    chip: 'bg-lime-100 text-yellow-900 border-lime-300',
    circle: 'bg-lime-200 border-lime-300 text-yellow-700',
  },
  delete: {
    chip: 'bg-red-100 text-red-800 border-red-300',
    circle: 'bg-red-200 border-red-300 text-red-600',
  },
}

const DEFAULT_STATE_COLOR: StateColor = {
  chip: 'bg-gray-100 text-gray-800 border-gray-300',
  circle: 'bg-gray-200 border-gray-300 text-gray-600',
}

export function getStateColor(stateName?: string): StateColor {
  if (!stateName) return DEFAULT_STATE_COLOR
  return STATE_COLORS[stateName] ?? DEFAULT_STATE_COLOR
}
