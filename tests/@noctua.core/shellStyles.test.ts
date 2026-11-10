import { afterEach, describe, expect, it } from 'vitest'
import { disableShellStylesheets } from '@/@noctua.core/theme/shellStyles'

const addLink = (href: string, rel = 'stylesheet') => {
  const link = document.createElement('link')
  link.rel = rel
  link.href = href
  document.head.appendChild(link)
  return link
}

describe('disableShellStylesheets', () => {
  afterEach(() => {
    document.head.innerHTML = ''
  })

  it('disables the stylesheets the Noctua shell links on every workbench', () => {
    const shell = [
      addLink('/bootstrap.min.css'),
      addLink('/jquery-ui-1.10.3.custom.min.css'),
      addLink('/bbop.css'),
      addLink('https://noctua.example.org/amigo.css?v=2'),
    ]

    expect(disableShellStylesheets()).toEqual(shell)
    shell.forEach(link => expect(link.disabled).toBe(true))
  })

  it("leaves the app's own and unrelated stylesheets alone", () => {
    const own = [
      addLink('/workbench/noctua-landing-page/assets/css/index-abc123.css'),
      addLink('/noctua_common.css'),
      addLink('/my-bootstrap-theme.css'),
      addLink('/bootstrap.min.css', 'preload'),
    ]

    expect(disableShellStylesheets()).toEqual([])
    // jsdom has no `disabled` on <link> until something sets it.
    own.forEach(link => expect(link.disabled).not.toBe(true))
  })
})
