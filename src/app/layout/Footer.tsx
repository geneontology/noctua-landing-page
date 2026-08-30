import type React from 'react';
import { Link } from 'react-router-dom';
import { EXTERNAL_LINKS } from '@/@noctua.core/data/constants';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="footer flex flex-row items-start bg-gradient-to-r from-slate-900 to-indigo-900 p-5 text-white">
      {/* Left Section */}
      <div className="flex flex-1 flex-row items-start">
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
          <Link to="/docs/go-citation-policy/" className="text-white">
            Citation and Terms of Use
          </Link>
        </div>
      </div>

      {/* Spacer */}
      <span className="grow"></span>

      {/* Right Section */}
      <div className="flex-1 text-right">
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
  );
};

export default Footer;