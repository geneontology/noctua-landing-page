import type React from 'react'
import { Link } from 'react-router-dom'
import { EXTERNAL_LINKS } from '@/@noctua.core/data/constants'

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <div className="footer flex flex-row items-start bg-gradient-to-r from-slate-900 to-indigo-900 p-5 text-white">
      {/* Left Section. Angular's 50% / spacer / 40% split: as three equal
          columns the links got a third of the width and "Contact us" wrapped
          at 1280px. */}
      <div className="flex max-w-[50%] basis-1/2 flex-row items-start">
        <div className="mr-4">
          <Link to="/" className="text-white">
            Home
          </Link>
        </div>
        <div className="mr-4">
          <a
            href={EXTERNAL_LINKS.GO_HELP}
            className="text-white"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact us
          </a>
        </div>
        <div className="mr-4">
          {/* A geneontology.org page. As an in-app <Link> it hit a route this
              app does not have, and the router's error page replaced the app. */}
          <a
            href={EXTERNAL_LINKS.GO_CITATION_POLICY}
            className="text-white"
            target="_blank"
            rel="noopener noreferrer"
          >
            Citation and Terms of Use
          </a>
        </div>
      </div>

      {/* Spacer */}
      <span className="grow"></span>

      {/* Right Section */}
      <div className="max-w-[40%] basis-2/5 text-right">
        <small>
          Copyright © 1999-{currentYear} Member of the{' '}
          <a
            href={EXTERNAL_LINKS.OBO_FOUNDRY}
            className="text-white underline"
            rel="noopener noreferrer"
            target="_blank"
            title="Open Biological Ontologies"
          >
            Open Biological Ontologies Foundry
          </a>
          . The Gene Ontology Consortium is supported by a P41 grant from the National Human Genome
          Research Institute (NHGRI) [grant{' '}
          <a
            href={EXTERNAL_LINKS.NIH_GRANT}
            className="text-white underline"
            rel="noopener noreferrer"
            target="_blank"
            title="National Human Genome Research Institute grant 2U41HG002273-17"
          >
            U41 HG002273
          </a>
          ].
        </small>
      </div>
    </div>
  )
}

export default Footer
