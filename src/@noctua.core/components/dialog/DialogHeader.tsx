import type { ReactNode } from 'react'
import { ActionIcon, Tooltip } from '@mantine/core'
import { MdClose as CloseIcon } from 'react-icons/md'

interface DialogHeaderProps {
  title: ReactNode
  onClose: () => void
}

const DialogHeader = ({ title, onClose }: DialogHeaderProps) => (
  <div className="flex h-16 shrink-0 items-center justify-between border-b-2 border-b-primary-500 bg-white px-4">
    <span className="text-xl font-semibold tracking-tight text-gray-900">{title}</span>
    <Tooltip label="Close" withArrow position="left">
      <ActionIcon
        onClick={onClose}
        aria-label="Close"
        variant="subtle"
        color="gray"
        size="lg"
        radius="xl"
        className="!text-gray-500 hover:!bg-gray-100 hover:!text-gray-900"
      >
        <CloseIcon size={20} />
      </ActionIcon>
    </Tooltip>
  </div>
)

export default DialogHeader
