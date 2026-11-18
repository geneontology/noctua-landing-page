/**
 * Stylesheets the Noctua shell links into every workbench page
 * (`pup_tent.set_common('css_libs', …)` in noctua.js). Nothing this app renders
 * uses them — the shell's Bootstrap navbar is hidden in index.css — and their
 * global element rules fight Mantine and Tailwind: Bootstrap's
 * `input[type="checkbox"] { margin: 4px 0 0 }` dropped the checkbox below its
 * tick, its `label` rule bolded every label (#139), and `html { font-size: 10px }`
 * shrank every rem.
 */
const SHELL_STYLESHEET = /\/(bootstrap|jquery-ui[^/]*|bbop|amigo)(\.min)?\.css(\?.*)?$/i

/**
 * Switch the shell's stylesheets off. They stay in the document, so deleting
 * this call (or setting `disabled = false` in devtools) brings them back. The
 * shell's scripts are left alone. Returns the links it disabled.
 */
export const disableShellStylesheets = (doc: Document = document): HTMLLinkElement[] => {
  const disabled: HTMLLinkElement[] = []
  doc.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"]').forEach(link => {
    if (SHELL_STYLESHEET.test(link.href)) {
      link.disabled = true
      disabled.push(link)
    }
  })
  return disabled
}
