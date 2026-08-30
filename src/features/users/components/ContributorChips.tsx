import type React from 'react'
import { FaUser } from 'react-icons/fa'
import { usePopover } from '@/@noctua.core/hooks/usePopover'
import AnchoredMenu, { MenuItem } from '@/@noctua.core/components/menu/AnchoredMenu'
import Chip from '@/@noctua.core/components/chip/Chip'
import type { Contributor } from '@/features/users/models/contributor'

const MAX_VISIBLE = 2

/** Angular `noc-user-chip`: #bbc9cc border, 20% fill, initials in black on the circle. */
const CHIP_STYLE = { borderColor: '#bbc9cc', backgroundColor: 'rgba(187, 201, 204, 0.2)' }
const CIRCLE_STYLE = { backgroundColor: '#bbc9cc' }

interface ContributorChipsProps {
  contributors: Contributor[]
  /** When provided, chips become buttons — used to add a contributor to the filters. */
  onChipClick?: (contributor: Contributor) => void
}

const ContributorIcon: React.FC<{ contributor: Contributor }> = ({ contributor }) =>
  contributor.initials ? (
    <span className="text-2xs text-black">{contributor.initials}</span>
  ) : (
    <FaUser size={10} className="text-[#59939e]" />
  )

const ContributorChips: React.FC<ContributorChipsProps> = ({ contributors, onChipClick }) => {
  const overflowMenu = usePopover()

  const visible = contributors.slice(0, MAX_VISIBLE)
  const hidden = contributors.slice(MAX_VISIBLE)

  return (
    <div className="flex grow items-center overflow-x-auto">
      <div className="flex flex-nowrap gap-1.5">
        {visible.map(contributor => (
          <Chip
            key={contributor.uri}
            size="sm"
            icon={<ContributorIcon contributor={contributor} />}
            chipStyle={contributor.color ? { ...CHIP_STYLE, borderColor: contributor.color } : CHIP_STYLE}
            circleStyle={contributor.color ? { backgroundColor: contributor.color } : CIRCLE_STYLE}
            className="max-w-[200px]"
            title={`Add ${contributor.name ?? contributor.uri} to filters`}
            onClick={onChipClick ? () => onChipClick(contributor) : undefined}
          >
            {contributor.name ?? contributor.uri}
          </Chip>
        ))}

        {hidden.length > 0 && (
          <>
            <button
              type="button"
              style={CHIP_STYLE}
              className="flex h-[25px] shrink-0 cursor-pointer items-center rounded-full border px-2.5 text-2xs hover:brightness-95"
              onClick={e => overflowMenu.open(e.currentTarget)}
            >
              +{hidden.length} more
            </button>
            <AnchoredMenu
              anchorEl={overflowMenu.anchor}
              open={overflowMenu.isOpen}
              onClose={overflowMenu.close}
            >
              {hidden.map(contributor => (
                <MenuItem
                  key={contributor.uri}
                  onClick={() => {
                    overflowMenu.close()
                    onChipClick?.(contributor)
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
                      style={
                        contributor.color ? { backgroundColor: contributor.color } : CIRCLE_STYLE
                      }
                    >
                      <ContributorIcon contributor={contributor} />
                    </div>
                    <span>{contributor.name ?? contributor.uri}</span>
                  </div>
                </MenuItem>
              ))}
            </AnchoredMenu>
          </>
        )}
      </div>
    </div>
  )
}

export default ContributorChips
