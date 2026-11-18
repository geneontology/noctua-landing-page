import type { ReactNode } from 'react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { FocusTrap, Portal } from '@mantine/core'

interface AnchoredPopoverProps {
  anchorEl: HTMLElement | null
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
  /** Preferred placement; auto-flips when the popover would overflow the viewport. */
  placement?: 'bottom-start' | 'bottom-end'
  /** When false, clicks on the backdrop do not trigger onClose. Default: true. */
  closeOnClickOutside?: boolean
  /** When false, pressing Escape does not trigger onClose. Default: true. */
  closeOnEscape?: boolean
  /** Keep Tab inside the popover while it is open, for dialog-like content.
   *  Focus starts on the element marked `data-autofocus`, else the first one. */
  trapFocus?: boolean
}

const VIEWPORT_PAD = 4
const ANCHOR_GAP = 4

// Sit between Mantine's Modal (z=200) and its nested Popover/Combobox (z=300).
// This way the backdrop blocks parent-modal interactions, but Selects opened
// from inside the popover still render above us.
const BACKDROP_Z = 250
const POPOVER_Z = 260

const AnchoredPopover = ({
  anchorEl,
  open,
  onClose,
  children,
  className,
  placement = 'bottom-start',
  closeOnClickOutside = true,
  closeOnEscape = true,
  trapFocus = false,
}: AnchoredPopoverProps) => {
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

    const popRect = el.getBoundingClientRect()

    if (placement === 'bottom-start' && popRect.right > window.innerWidth - VIEWPORT_PAD) {
      el.style.left = ''
      el.style.right = `${Math.max(VIEWPORT_PAD, window.innerWidth - anchorRect.right)}px`
    } else if (placement === 'bottom-end' && popRect.left < VIEWPORT_PAD) {
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
    // Capture-phase ESC: consume the event so it doesn't reach the parent
    // dialog's keydown handler (otherwise pressing Escape would close both).
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // An open select or autocomplete inside closes its own list first. Its
      // handler is on the target, so let the event through; the popover root
      // stops it there before it can reach a parent dialog.
      const target = e.target as HTMLElement | null
      if (el && target && el.contains(target) && target.closest('[aria-expanded="true"]')) return
      e.stopPropagation()
      if (closeOnEscape) onClose()
    }
    document.addEventListener('keydown', handleKey, true)
    return () => document.removeEventListener('keydown', handleKey, true)
  }, [open, onClose, closeOnEscape, el])

  // Hand focus back to whatever opened the popover. Unmounting the content
  // otherwise drops it on <body>, and the next Tab starts from the top of the
  // page. Only when focus really was lost — a click into another field keeps it.
  const lastAnchor = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (anchorEl) lastAnchor.current = anchorEl
  }, [anchorEl])
  const wasOpen = useRef(open)
  useEffect(() => {
    if (wasOpen.current && !open) {
      const active = document.activeElement
      const anchor = lastAnchor.current
      if ((!active || active === document.body) && anchor?.isConnected) anchor.focus()
    }
    wasOpen.current = open
  }, [open])

  if (!open) return null

  return (
    <Portal>
      {/* Backdrop: blocks pointer events to everything underneath. Click
          dismisses when allowed, otherwise just absorbs the event. */}
      <div
        className="fixed inset-0 bg-blue-950/10"
        style={{ zIndex: BACKDROP_Z }}
        onMouseDown={e => {
          e.stopPropagation()
          if (closeOnClickOutside) onClose()
        }}
      />
      <div
        ref={setEl}
        className={`rounded-md border border-gray-200 bg-primary-100 text-gray-900 shadow-lg ${className ?? ''}`}
        style={{ position: 'fixed', visibility: 'hidden', zIndex: POPOVER_Z }}
        // The Escape a nested select handled (see above) stops here.
        onKeyDown={e => e.key === 'Escape' && e.stopPropagation()}
      >
        {trapFocus ? (
          <FocusTrap active>
            <div>{children}</div>
          </FocusTrap>
        ) : (
          children
        )}
      </div>
    </Portal>
  )
}

export default AnchoredPopover
