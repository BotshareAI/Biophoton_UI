import { cn } from '@renderer/lib/utils'
import { Avatar } from '../users/Avatar'

type Props = {
  file?: string | null
  previewUrl?: string | null
  editable?: boolean
  onClickPick?: () => void
  className?: string
}

export function PickAvatar({
  file, // stored filename
  previewUrl, // data: URL from picker (unsaved)
  editable,
  onClickPick,
  className
}: Props): React.JSX.Element {
  const src = previewUrl ?? (file ? `avatar:///${file}` : undefined)
  return (
    <button
      type="button"
      onClick={() => editable && onClickPick?.()}
      className={cn(
        'inline-flex items-center justify-center rounded-full border size-24 p-0 overflow-hidden bg-muted relative',
        editable && 'hover:ring-2 hover:ring-primary/50 focus:outline-none',
        className
      )}
      aria-label={editable ? 'Select photo' : 'Profile photo'}
    >
      <Avatar src={src} />
    </button>
  )
}
