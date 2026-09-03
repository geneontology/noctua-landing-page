import type React from 'react'
import { useAuth } from '@/features/auth/authProvider'
import { EXTERNAL_LINKS } from '@/@noctua.core/data/constants'
import { WorkbenchId } from '../models/workbenchId'
import { useCreateModel } from '../hooks/useCreateModel'

/**
 * The Angular hero: `gene.jpeg` under a left-to-right navy gradient, 320px tall,
 * centred white type. Section headings are flanked by rules drawn with
 * `::before`/`::after` — reproduced here with flex-grow hairlines.
 */
const HERO_BACKGROUND =
  'linear-gradient(to right, #00174f, rgba(0, 23, 79, 0.8), rgba(0, 23, 79, 0.5)), url("assets/images/gene.jpeg")'

const RuledHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mb-2 flex w-full items-center gap-2">
    <span className="h-px grow bg-[#ddd]/70" />
    <span className="text-base font-bold uppercase text-[#eee]">{children}</span>
    <span className="h-px grow bg-[#ddd]/70" />
  </div>
)

/**
 * `.noc-rounded-button.noc-half-button` at the hero's sizing: a 20px-radius,
 * 50px-tall pill, 120px minimum, 12px/20px accent-blue type on white with a
 * level-4 shadow. Angular's copy is uppercase and `text-transform: capitalize`
 * leaves it that way.
 */
const CREATE_BUTTON =
  'flex h-[50px] min-w-[120px] items-center justify-center rounded-[20px] bg-white px-3 text-center text-xs uppercase leading-5 text-noc-accent shadow-md transition hover:brightness-95 disabled:opacity-60'

// `.noc-r` / `.noc-l` square off the facing corners so the two Create buttons
// read as one split pill with a 2px seam, rather than two separate buttons.
const CREATE_BUTTON_LEFT = `${CREATE_BUTTON} !rounded-r-none mr-0.5`
const CREATE_BUTTON_RIGHT = `${CREATE_BUTTON} !rounded-l-none`

const WelcomeHeader: React.FC = () => {
  const { isLoggedIn, loginUrl } = useAuth()
  const { create, isCreating } = useCreateModel()

  return (
    <div
      className="relative flex min-h-[320px] w-full shrink-0 flex-col items-center justify-center overflow-hidden px-4 pb-3 pt-8 text-center"
      style={{
        backgroundImage: HERO_BACKGROUND,
        backgroundSize: 'cover',
        backgroundPosition: 'top',
      }}
    >
      <h1 className="mb-4 text-[40px] font-light leading-tight tracking-[0.01em] text-white/90">
        WELCOME TO NOCTUA
      </h1>

      <h3 className="m-0 max-w-[80%] text-base font-light leading-normal tracking-[0.03em] text-white">
        Noctua is a web-based, collaborative Gene Ontology (GO) annotation tool developed by the GO
        Consortium to create{' '}
        <a
          href={EXTERNAL_LINKS.GO_ANNOTATIONS_DOCS}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#bcd9f4] underline"
        >
          standard GO annotations
        </a>{' '}
        as well as{' '}
        <a
          href={EXTERNAL_LINKS.GOCAM_OVERVIEW_DOCS}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#bcd9f4] underline"
        >
          GO-CAMs (Gene Ontology Causal Activity Models).
        </a>
      </h3>

      {!isLoggedIn ? (
        <h4 className="m-0 max-w-[80%] pt-2.5 text-xs font-light text-white/80">
          You must{' '}
          <a
            href={loginUrl}
            className="mx-1 mt-5 inline-block rounded bg-noc-login px-3 py-1.5 text-[#eee] no-underline shadow-md hover:brightness-110"
            data-pw="noc-login-link"
          >
            Login
          </a>{' '}
          to create or edit models. Models may be viewed without login.
        </h4>
      ) : (
        <div className="mt-5 flex w-full max-w-5xl flex-col items-stretch gap-2 p-2 sm:flex-row">
          <div className="flex basis-3/4 flex-col items-center bg-noc-accent/50 p-2">
            <RuledHeading>Create</RuledHeading>
            <div className="flex items-center justify-center">
              <button
                type="button"
                disabled={isCreating}
                className={CREATE_BUTTON_LEFT}
                onClick={() => create(WorkbenchId.STANDARD_ANNOTATIONS)}
                data-pw="create-standard-annotations-button"
              >
                Standard Annotations
                <br />
                Editor
              </button>
              <button
                type="button"
                disabled={isCreating}
                className={CREATE_BUTTON_RIGHT}
                onClick={() => create(WorkbenchId.VISUAL_PATHWAY_EDITOR)}
                data-pw="open-pathway-editor-button"
              >
                GO-CAM Visual Pathway
                <br />
                Editor
              </button>
            </div>
          </div>

          <div className="flex basis-1/4 flex-col items-center bg-noc-accent/50 p-2">
            <RuledHeading>Help</RuledHeading>
            <a
              href={EXTERNAL_LINKS.NOCTUA_USERS_GUIDE}
              target="_blank"
              rel="noopener noreferrer"
              className={CREATE_BUTTON}
            >
              User Guide
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

export default WelcomeHeader
