import { useEffect, useMemo, useState } from 'react'
import { Button } from '@renderer/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Folder, Image as ImageIcon, ChevronLeft } from 'lucide-react'
import { cn } from '@renderer/lib/utils'

type Mount = { id: string; label: string; path: string }
type Item = {
  name: string
  isDir: boolean
  ext: string
  relPath: string
  size: number
  mtime: number
}

export function UsbPhotoPicker({
  open,
  onClose,
  onChosen
}: {
  open: boolean
  onClose: () => void
  onChosen: (sel: { root: string; relPath: string; previewUrl: string }) => void
}): React.JSX.Element {
  const [mounts, setMounts] = useState<Mount[]>([])
  const [root, setRoot] = useState<Mount | null>(null)
  const [cwd, setCwd] = useState<string>('') // rel to root
  const [items, setItems] = useState<Item[]>([])
  const [canUp, setCanUp] = useState(false)
  const [selected, setSelected] = useState<Item | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [filter, setFilter] = useState('')

  // Load mounts on open
  useEffect(() => {
    if (!open) return
    ;(async () => {
      const m = await window.api.listMounts()
      setMounts(m)
      setRoot(m[0] ?? null)
      setCwd('')
      setSelected(null)
      setPreview('')
    })()
  }, [open])

  // List directory whenever root/cwd changes
  useEffect(() => {
    if (!root) return
    ;(async () => {
      const { items, canUp } = await window.api.listDir(root.path, cwd)
      setItems(items)
      setCanUp(canUp)
      setSelected(null)
      setPreview('')
    })()
  }, [root, cwd])

  // Load preview when selecting an image
  useEffect(() => {
    if (!root || !selected || selected.isDir) {
      setPreview('')
      return
    }
    ;(async () => {
      const url = await window.api.getImagePreview(root.path, selected.relPath)
      setPreview(url)
    })()
  }, [root, selected])

  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase()
    return q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items
  }, [items, filter])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="min-w-3xl bg-white">
        <DialogHeader>
          <DialogTitle>Select a photo from USB</DialogTitle>
        </DialogHeader>

        {/* Mount selector */}
        <div className="flex gap-2 items-center">
          <div className="flex gap-2 flex-wrap">
            {mounts.length === 0 && (
              <span className="text-sm text-muted-foreground">No removable storage detected.</span>
            )}
            {mounts.map((m) => (
              <Button
                key={m.id}
                size="sm"
                variant={root?.id === m.id ? 'default' : 'outline'}
                onClick={() => {
                  setRoot(m)
                  setCwd('')
                }}
              >
                {m.label || 'Removable'} <span className="ml-2 text-xs opacity-70">{m.path}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Path bar & search */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={!canUp}
            onClick={() => {
              const parts = cwd.split('/').filter(Boolean)
              parts.pop()
              setCwd(parts.join('/'))
            }}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="text-sm flex-1 truncate">
            <span className="font-mono">{root?.path}</span>
            {cwd && <span className="font-mono">/{cwd}</span>}
          </div>
          <Input
            placeholder="Filter…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-57"
          />
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* File grid */}
          <div className="col-span-8 border rounded-lg p-2 h-96 overflow-auto">
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {shown.map((it) => (
                <button
                  key={it.relPath}
                  className={cn(
                    'border rounded p-2 text-left hover:bg-accent focus:outline-none',
                    selected?.relPath === it.relPath && 'ring-2 ring-primary'
                  )}
                  onClick={() => {
                    if (it.isDir) {
                      const rel = it.relPath.replaceAll('\\', '/')
                      setCwd(rel)
                    } else {
                      setSelected(it)
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    {it.isDir ? <Folder className="size-4" /> : <ImageIcon className="size-4" />}
                    <span className="truncate">{it.name}</span>
                  </div>
                  {!it.isDir && (
                    <div className="text-[10px] text-muted-foreground mt-1 uppercase">
                      {it.ext.replace('.', '')}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview pane */}
          <div className="col-span-4 border rounded-lg p-2 h-96">
            {selected && !selected.isDir ? (
              <div className="flex flex-col h-full">
                <div className="text-sm font-medium mb-2 truncate">{selected.name}</div>
                {preview ? (
                  <img src={preview} alt="preview" className="object-contain w-full h-full" />
                ) : (
                  <div className="text-sm text-muted-foreground">Loading preview…</div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground h-full flex items-center justify-center">
                Select an image to preview
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!root || !selected || selected.isDir || !preview) return
              onChosen({
                root: root.path,
                relPath: selected.relPath.replaceAll('\\', '/'),
                previewUrl: preview
              })
              onClose()
            }}
            disabled={!root || !selected || !!selected?.isDir || !preview}
          >
            Choose
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
