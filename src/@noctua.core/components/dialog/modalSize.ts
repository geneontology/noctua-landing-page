/** Pixel widths for the size tokens used by SimpleDialog. */
export const MODAL_SIZE_PX: Record<string, number> = {
  xs: 444,
  sm: 600,
  cam: 1200,
  md: 900,
  lg: 1200,
  xl: 1536,
}

export const resolveModalSize = (
  size: string | number | undefined,
  fallback: keyof typeof MODAL_SIZE_PX = 'md'
): number => {
  if (typeof size === 'number') return size
  if (typeof size === 'string' && size in MODAL_SIZE_PX) return MODAL_SIZE_PX[size]
  return MODAL_SIZE_PX[fallback]
}
