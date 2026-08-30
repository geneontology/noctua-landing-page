import type { ReactNode } from 'react'
import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { Portal } from '@mantine/core'

interface AnchoredMenuProps {
  anchorEl: HTMLElement | null
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
  /** Preferred placement; auto-flips when the menu would overflow the viewport. */
  placement?: 'bottom-start' | 'bottom-end'
}

const VIEWPORT_PAD = 4
const ANCHOR_GAP = 4

const AnchoredMenu = ({
  anchorEl,
  open,
  onClose,
  children,
  className,
  placement = 'bottom-start',
}: AnchoredMenuProps) => {
  // State-backed ref: Mantine's Portal returns null on first render and only
  // mounts its children after its own internal effect runs. A plain useRef
  // would never trigger re-positioning because this component doesn't
  // re-render when the portal child finally attaches.
  const [el, setEl] = useState<HTMLDivElement | null>(null)

  const updatePosition = useCallback(() => {
    if (!anchorEl || !el) return

    const anchorRect = anchorEl.getBoundingClientRect()

    if (anchorRect.width === 0 && anchorRect.height === 0 && anchorRect.top === 0) {
      el.style.visibility = 'hidden'
      return
    }

    el.style.position = 'fixed'
    el.style.visibility = 'hidden'
    el.style.top = `${anchorRect.bottom + ANCHOR_GAP}px`
    el.style.left = ''
    el.style.right = ''

    if (placement === 'bottom-end') {
      el.style.right = `${Math.max(VIEWPORT_PAD, window.innerWidth - anchorRect.right)}px`
    } else {
      el.style.left = `${Math.max(VIEWPORT_PAD, anchorRect.left)}px`
    }

    const menuRect = el.getBoundingClientRect()

    if (placement === 'bottom-start' && menuRect.right > window.innerWidth - VIEWPORT_PAD) {
      el.style.left = ''
      el.style.right = `${Math.max(VIEWPORT_PAD, window.innerWidth - anchorRect.right)}px`
    } else if (placement === 'bottom-end' && menuRect.left < VIEWPORT_PAD) {
      el.style.right = ''
      el.style.left = `${Math.max(VIEWPORT_PAD, anchorRect.left)}px`
    }

    const settled = el.getBoundingClientRect()
    if (settled.bottom > window.innerHeight - VIEWPORT_PAD) {
      const flippedTop = anchorRect.top - settled.height - ANCHOR_GAP
      el.style.top = `${Math.max(VIEWPORT_PAD, flippedTop)}px`
    }

    el.style.visibility = 'visible'
  }, [anchorEl, placement, el])

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
  }, [open, updatePosition])

  useEffect(() => {
    if (!open || !el || !anchorEl) return

    const handle = () => updatePosition()
    window.addEventListener('resize', handle)
    // Capture phase so scrolls in any nested container are caught.
    window.addEventListener('scroll', handle, true)

    const observer = new ResizeObserver(handle)
    observer.observe(el)
    observer.observe(anchorEl)

    return () => {
      window.removeEventListener('resize', handle)
      window.removeEventListener('scroll', handle, true)
      observer.disconnect()
    }
  }, [open, el, anchorEl, updatePosition])

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (el?.contains(target)) return
      if (anchorEl?.contains(target)) return
      // Exempt nested popups opened from inside the menu (Select/Combobox/Menu
      // dropdowns), but NOT ancestor dialogs or portals — those would prevent
      // dismissal when clicking another anchor in the same parent dialog.
      if (
        target.closest(
          '[role="listbox"], [role="menu"], [role="tooltip"], [data-mantine-stop-propagation]'
        )
      ) {
        return
      }
      if (target.closest('[class*="Select"], [class*="Combobox"], [class*="Popover-dropdown"], [class*="Menu-dropdown"]')) {
        return
      }
      onClose()
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open, anchorEl, onClose, el])

  if (!open) return null

  return (
    <Portal>
      <div
        ref={setEl}
        className={`z-[1300] min-w-[160px] rounded-md border border-gray-200 bg-primary-100 py-1 text-gray-900 shadow-lg ${className ?? ''}`}
        style={{ position: 'fixed', visibility: 'hidden' }}
      >
        {children}
      </div>
    </Portal>
  )
}

interface MenuItemProps {
  onClick?: (e: React.MouseEvent) => void
  className?: string
  children: ReactNode
}

export const MenuItem = ({ onClick, className, children }: MenuItemProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`block w-full px-3 py-1.5 text-left text-sm text-gray-900 hover:bg-primary-200 ${className ?? ''}`}
  >
    {children}
  </button>
)

export default AnchoredMenu
