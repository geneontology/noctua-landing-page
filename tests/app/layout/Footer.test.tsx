import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Footer from '@/app/layout/Footer'
import { EXTERNAL_LINKS } from '@/@noctua.core/data/constants'
import { renderWithProviders } from '@tests/test-utils'

const renderFooter = () =>
  renderWithProviders(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>
  )

const linkTo = (name: string) => screen.getByRole('link', { name })

describe('Footer', () => {
  it('links home within the app', () => {
    renderFooter()

    expect(linkTo('Home')).toHaveAttribute('href', '/')
  })

  it('links to GO help in a new tab', () => {
    renderFooter()

    expect(linkTo('Contact us')).toHaveAttribute('href', EXTERNAL_LINKS.GO_HELP)
    expect(linkTo('Contact us')).toHaveAttribute('target', '_blank')
  })

  // Regression: an in-app <Link> to `/docs/go-citation-policy/`, a route this
  // app does not have, so following it swapped the app for the router's 404.
  it('sends the citation policy to geneontology.org, not an app route', () => {
    renderFooter()

    const citation = linkTo('Citation and Terms of Use')
    expect(citation).toHaveAttribute('href', EXTERNAL_LINKS.GO_CITATION_POLICY)
    expect(citation.getAttribute('href')).toMatch(/^https:\/\/geneontology\.org\//)
    expect(citation).toHaveAttribute('target', '_blank')
    expect(citation.getAttribute('rel')).toContain('noopener')
  })

  it('credits the OBO Foundry and the NIH grant', () => {
    renderFooter()

    expect(linkTo('Open Biological Ontologies Foundry')).toHaveAttribute(
      'href',
      EXTERNAL_LINKS.OBO_FOUNDRY
    )
    expect(linkTo('U41 HG002273')).toHaveAttribute('href', EXTERNAL_LINKS.NIH_GRANT)
  })

  it('runs the copyright to the current year', () => {
    renderFooter()

    expect(screen.getByText(new RegExp(`1999-${new Date().getFullYear()}`))).toBeInTheDocument()
  })
})
