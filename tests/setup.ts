import '@testing-library/jest-dom/vitest'

// jsdom lacks window.matchMedia; Mantine's MantineProvider color-scheme logic
// calls it on mount. Provide a stub so component tests can render Mantine
// components (Modal, etc.) without crashing.
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

// jsdom lacks ResizeObserver; Mantine's Textarea autosize uses it.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

// jsdom lacks Element.prototype.scrollIntoView; the Comments panel calls it to
// bring the selected activity section into view when the selection changes.
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

// jsdom lacks document.fonts; Mantine's Textarea autosize listens to it.
if (typeof document !== 'undefined' && !document.fonts) {
  Object.defineProperty(document, 'fonts', {
    writable: true,
    value: {
      addEventListener: () => {},
      removeEventListener: () => {},
      ready: Promise.resolve(),
    },
  })
}
