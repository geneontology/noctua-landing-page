import type React from 'react'
import { Button } from '@mantine/core'
import { IoChevronDown } from 'react-icons/io5'
import AnchoredMenu, { MenuItem } from '@/@noctua.core/components/menu/AnchoredMenu'
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

  // Angular put the editor matching the model's GPAD conformance first.
  const editorLinks =
    model.conformsToGpad === true
      ? [
          { label: 'Standard Annotations Editor', href: urls.workbenches[WorkbenchId.STANDARD_ANNOTATIONS], pw: 'open-standard-annotation-button' },
          { label: 'Visual Pathway Editor', href: urls.workbenches[WorkbenchId.VISUAL_PATHWAY_EDITOR] },
        ]
      : [
          { label: 'Visual Pathway Editor', href: urls.workbenches[WorkbenchId.VISUAL_PATHWAY_EDITOR] },
          { label: 'Standard Annotations Editor', href: urls.workbenches[WorkbenchId.STANDARD_ANNOTATIONS], pw: 'open-standard-annotation-button' },
        ]

  const links = [
    ...editorLinks,
    { label: 'Noctua Form', href: urls.workbenches[WorkbenchId.FORM] },
    { label: 'Graph Editor', href: urls.graphEditorUrl },
    { label: 'Pathway Viewer', href: urls.workbenches[WorkbenchId.ALLIANCE_PATHWAY_PREVIEW] },
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
        className="!border-noc-primary/50 !bg-white !text-2xs !text-noc-primary !shadow-sm"
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
          <MenuItem key={link.label} onClick={menu.close}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
              data-pw={link.pw}
            >
              {link.label}
            </a>
          </MenuItem>
        ))}
        <MenuItem onClick={openCopyDialog}>Copy Model</MenuItem>
        <MenuItem onClick={menu.close}>
          <a
            href={urls.workbenches[WorkbenchId.ANNOTATION_PREVIEW]}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            Annotation Preview
          </a>
        </MenuItem>
      </AnchoredMenu>
    </>
  )
}

export default ModelActionsMenu
