import type React from 'react'
import { Button } from '@mantine/core'
import { IoChevronDown } from 'react-icons/io5'
import AnchoredMenu, { MenuItem, MenuLink } from '@/@noctua.core/components/menu/AnchoredMenu'
import { usePopover } from '@/@noctua.core/hooks/usePopover'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { openDialog, DialogComponent } from '@/@noctua.core/components/dialog/dialogSlice'
import { selectBaristaToken } from '@/features/auth/slices/authSlice'
import type { CamRow } from '../models/camSearch'
import { WorkbenchId } from '../models/workbenchId'
import { buildModelUrls } from '../services/modelUrls'

interface ModelActionsMenuProps {
  model: CamRow
}

const ModelActionsMenu: React.FC<ModelActionsMenuProps> = ({ model }) => {
  const menu = usePopover()
  const dispatch = useAppDispatch()
  const baristaToken = useAppSelector(selectBaristaToken)

  const urls = buildModelUrls(model.id, baristaToken)
  const isSae = model.saeTag === true

  const vpeLink: { label: string; href: string; pw?: string } = {
    label: 'Visual Pathway Editor',
    href: urls.workbenches[WorkbenchId.VISUAL_PATHWAY_EDITOR],
  }
  const saeLink = {
    label: 'Standard Annotations Editor',
    href: urls.workbenches[WorkbenchId.STANDARD_ANNOTATIONS],
    pw: 'open-standard-annotation-button',
  }

  // #140, from the SAE tag: true → SAE only, false (a VPE model) → VPE only. An untagged model
  // leads with VPE but still offers SAE — not every model holding standard annotations is tagged.
  const editorLinks =
    model.saeTag === true ? [saeLink] : model.saeTag === false ? [vpeLink] : [vpeLink, saeLink]
  const links = [
    ...editorLinks,
    { label: 'Graph Editor', href: urls.graphEditorUrl },
    // A standard-annotations model has no pathway to view.
    ...(isSae
      ? []
      : [
          {
            label: 'Pathway Viewer',
            href: urls.workbenches[WorkbenchId.ALLIANCE_PATHWAY_PREVIEW],
          },
        ]),
  ]

  const openCopyDialog = () => {
    menu.close()
    dispatch(
      openDialog({
        component: DialogComponent.COPY_MODEL_DIALOG,
        title: 'Copy Model',
        size: 'md',
        customProps: { model },
      })
    )
  }

  return (
    <>
      <Button
        variant="default"
        size="compact-xs"
        rightSection={<IoChevronDown size={11} />}
        className="!border-noc-primary/50 !bg-white !text-xs !text-noc-primary !shadow-sm"
        onClick={e => menu.open(e.currentTarget)}
      >
        Actions
      </Button>
      <AnchoredMenu
        anchorEl={menu.anchor}
        open={menu.isOpen}
        onClose={menu.close}
        placement="bottom-end"
      >
        {links.map(link => (
          <MenuLink key={link.label} href={link.href} onClick={menu.close} data-pw={link.pw}>
            {link.label}
          </MenuLink>
        ))}
        {!isSae && <MenuItem onClick={openCopyDialog}>Copy Model</MenuItem>}
        <MenuLink href={urls.workbenches[WorkbenchId.ANNOTATION_PREVIEW]} onClick={menu.close}>
          Annotation Preview
        </MenuLink>
      </AnchoredMenu>
    </>
  )
}

export default ModelActionsMenu
