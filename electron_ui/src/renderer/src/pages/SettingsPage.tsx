import { Checkbox } from '@renderer/components/ui/checkbox'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Label } from '@renderer/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Slider } from '@renderer/components/ui/slider'
import { Switch } from '@renderer/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@renderer/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { useRemediesStore } from '@renderer/store/remediesStore'
import { useUserStore } from '@renderer/store/userStore'
import { Remedy } from '@shared/types/remedy'
import { Download, Edit, Pill, Settings as SettingsIcon, Trash2, Upload, User } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Dialog, DialogContent } from '@renderer/components/ui/dialog'
import { RemedyForm } from '@renderer/components/remedies/RemedyForm'
import i18n from '@renderer/i18n'
import { Locale, Settings } from '@shared/types/settings'
import { mappedGender } from '@renderer/constants/gender'
import { validateRemedy } from '@renderer/utils/validate-remedy'

function Row({ label, control }: { label: string; control: React.ReactNode }): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4 my-4 pb-4 px-2 border-b">
      <Label className="text-base whitespace-nowrap">{label}</Label>
      <div className="flex-1 flex justify-end">{control}</div>
    </div>
  )
}

function Section({
  title,
  children
}: {
  title?: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <Card className="rounded-2xl shadow-sm">
      {title && (
        <CardHeader>
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useDebounced<T extends (...args: any[]) => void>(fn: T, ms = 150): T {
  const ref = useMemo(() => ({ t: 0 as unknown as ReturnType<typeof setTimeout> }), [])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((...args: any[]) => {
    clearTimeout(ref.t)
    ref.t = setTimeout(() => fn(...args), ms)
  }) as T
}

export function SettingsPage({
  defaultSettings
}: {
  defaultSettings: Settings
}): React.JSX.Element {
  const [selectedRemedyIds, setSelectedRemedyId] = useState<number[]>([])
  const [selectedClientIds, setSelectedClientId] = useState<number[]>([])
  const [editing, setEditing] = useState<Remedy>()
  const [editorOpen, setEditorOpen] = useState(false)
  const form = useForm({
    defaultValues: defaultSettings
  })

  useEffect(() => {
    form.reset(defaultSettings)
  }, [defaultSettings, form])

  const persistVolume = useDebounced((v: number) => {
    window.api.set('volume', v)
  }, 150)
  const persistBrightness = useDebounced((v: number) => {
    window.api.set('brightness', v)
  }, 150)

  const remedies = useRemediesStore((state) => state.remedies)
  const deleteRemedies = useRemediesStore((state) => state.deleteRemedies)
  const updateRemedy = useRemediesStore((state) => state.updateRemedy)
  const users = useUserStore((state) => state.users)
  const deleteUsers = useUserStore((state) => state.deleteUsers)
  const onImportRemedies = (): void => {}
  const onImportClients = (): void => {}
  const toggleRemedySelected = (id: number, checked: boolean): void => {
    setSelectedRemedyId((prev) => (checked ? [...prev, id] : prev.filter((r) => r !== id)))
  }
  const toggleClientSelected = (id: number, checked: boolean): void => {
    setSelectedClientId((prev) => (checked ? [...prev, id] : prev.filter((r) => r !== id)))
  }
  const onSubmit = async (remedy: Remedy, setError, onSuccess): Promise<void> => {
    if (
      validateRemedy(remedy, (key, label) =>
        setError(key, { type: 'required', message: `${label} is required` })
      )
    ) {
      await updateRemedy(remedy)
      onSuccess()
      setEditorOpen(false)
    }
  }
  const allRemediesSelected = remedies.length > 0 && selectedRemedyIds.length === remedies.length
  const someRemediesSelected = selectedRemedyIds.length > 0 && !allRemediesSelected
  const allUsersSelected = users.length > 0 && selectedClientIds.length === users.length
  const someUsersSelected = selectedClientIds.length > 0 && !allUsersSelected
  return (
    <div>
      <p className="text-lg font-semibold mb-2">Settings</p>
      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general" className="inline-flex gap-2 items-center">
            <SettingsIcon />
            General
          </TabsTrigger>
          <TabsTrigger value="remedies" className="inline-flex gap-2 items-center">
            <Pill />
            Remedies
          </TabsTrigger>
          <TabsTrigger value="clients" className="inline-flex gap-2 items-center">
            <User />
            Clients
          </TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general" className="space-y-4">
          <Row
            label="App language"
            control={
              <Controller
                name="locale"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value as Locale}
                    onValueChange={async (v: Locale) => {
                      field.onChange(v)
                      await i18n.changeLanguage(v)
                      window.api.set('locale', v)
                    }}
                  >
                    <SelectTrigger className="w-52">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            }
          />
          <Row
            label="Brightness"
            control={
              <Controller
                name="brightness"
                control={form.control}
                render={({ field }) => (
                  <div className="flex items-center justify-end gap-4 w-full max-w-md">
                    <Slider
                      value={[field.value]}
                      min={1}
                      max={100}
                      step={1}
                      onValueChange={([v]) => {
                        field.onChange(v)
                        // debounced persist
                        persistBrightness(v)
                      }}
                      className="w-64"
                    />
                    <span className="w-10 text-right tabular-nums">{field.value}%</span>
                  </div>
                )}
              />
            }
          />
          <Row
            label="Enable sound"
            control={
              <Controller
                name="soundEnabled"
                control={form.control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={(v) => {
                      field.onChange(v)
                      window.api.set('soundEnabled', v)
                    }}
                  />
                )}
              />
            }
          />
          <Row
            label="Volume"
            control={
              <Controller
                name="volume"
                control={form.control}
                render={({ field }) => (
                  <div className="flex items-center justify-end gap-4 w-full max-w-md opacity-100">
                    <Slider
                      value={[field.value]}
                      min={0}
                      max={100}
                      step={1}
                      disabled={!form.watch('soundEnabled')}
                      onValueChange={([v]) => {
                        field.onChange(v)
                        persistVolume(v)
                      }}
                      className="w-64"
                    />
                    <span className="w-10 text-right tabular-nums">{field.value}%</span>
                  </div>
                )}
              />
            }
          />
        </TabsContent>
        {/* Remedy bank */}
        <TabsContent value="remedies" className="space-y-4 mt-4">
          <Section>
            <div className="flex gap-2 items-center justify-between mb-6">
              <p className="text-lg font-medium">Remedies</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={onImportRemedies}
                >
                  <Upload className="h-4 w-4" /> Import from USB
                </Button>
                <Button
                  variant="destructive"
                  className="flex items-center gap-2"
                  onClick={() => {
                    const ids = Array.from(selectedRemedyIds)
                    if (!ids.length) return alert('No remedies selected')
                    deleteRemedies(ids)
                    setSelectedRemedyId([])
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Delete selected
                </Button>
              </div>
            </div>

            <div className="rounded-xl border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={
                          allRemediesSelected
                            ? true
                            : someRemediesSelected
                              ? 'indeterminate'
                              : false
                        }
                        onCheckedChange={(c) => {
                          if (c) setSelectedRemedyId(remedies.map((r) => r.id))
                          else setSelectedRemedyId([])
                        }}
                        aria-label="Select all remedies"
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Subcategory</TableHead>
                    <TableHead>Meridian</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {remedies.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No remedies yet
                      </TableCell>
                    </TableRow>
                  )}
                  {remedies.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="w-10">
                        <Checkbox
                          checked={selectedRemedyIds.includes(r.id)}
                          onCheckedChange={(c) => toggleRemedySelected(r.id, Boolean(c))}
                          aria-label={`Select ${r.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-40 truncate">{r.name}</TableCell>
                      <TableCell>{r.category}</TableCell>
                      <TableCell>{r.subcategory}</TableCell>
                      <TableCell className="max-w-40 truncate">{r.meridians?.join(', ')}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditing(r)
                            setEditorOpen(true)
                          }}
                          aria-label="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Section>
        </TabsContent>

        {/* Clients */}
        <TabsContent value="clients" className="space-y-4 mt-4">
          <Section>
            <div className="flex gap-2 items-center justify-between mb-6">
              <p className="text-lg font-medium">Clients</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={onImportClients}
                >
                  <Upload className="h-4 w-4" /> Import from USB
                </Button>
                <Button
                  variant="destructive"
                  className="flex items-center gap-2"
                  onClick={() => {
                    const ids = Array.from(selectedClientIds)
                    if (!ids.length) return alert('No clients selected')
                    deleteUsers(ids)
                    setSelectedClientId([])
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Delete selected
                </Button>
              </div>
            </div>

            <div className="rounded-xl border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={
                          allUsersSelected ? true : someUsersSelected ? 'indeterminate' : false
                        }
                        onCheckedChange={(c) => {
                          if (c) setSelectedClientId(users.map((u) => u.id))
                          else setSelectedClientId([])
                        }}
                        aria-label="Select all clients"
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Date of Birth</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No clients yet
                      </TableCell>
                    </TableRow>
                  )}
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="w-10">
                        <Checkbox
                          checked={selectedClientIds.includes(u.id)}
                          onCheckedChange={(c) => toggleClientSelected(u.id, Boolean(c))}
                          aria-label={`Select ${u.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{`${u.firstName} ${u.lastName}`}</TableCell>
                      <TableCell>{u.dateOfBirth}</TableCell>
                      <TableCell>{mappedGender[u.gender]}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            // TODO export client
                          }}
                          aria-label="Export"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Section>
        </TabsContent>
      </Tabs>
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="bg-white">
          <p className="text-lg font-semibold mb-4">Edit Remedy</p>
          <RemedyForm
            defaultValues={editing}
            onSubmit={onSubmit}
            onCancel={() => setEditorOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
