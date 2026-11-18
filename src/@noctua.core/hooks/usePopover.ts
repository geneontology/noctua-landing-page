import { useState, useCallback } from 'react'

interface PopoverState<T = undefined> {
  anchor: HTMLElement | null
  data: T | undefined
}

interface UsePopoverReturn<T = undefined> {
  anchor: HTMLElement | null
  isOpen: boolean
  data: T | undefined
  open: (anchor: HTMLElement, data?: T) => void
  close: () => void
}

export function usePopover<T = undefined>(): UsePopoverReturn<T> {
  const [state, setState] = useState<PopoverState<T>>({
    anchor: null,
    data: undefined,
  })

  const open = useCallback((anchor: HTMLElement, data?: T) => {
    setState({ anchor, data: data as T })
  }, [])

  const close = useCallback(() => {
    setState({ anchor: null, data: undefined })
  }, [])

  return {
    anchor: state.anchor,
    isOpen: state.anchor !== null,
    data: state.data,
    open,
    close,
  }
}
