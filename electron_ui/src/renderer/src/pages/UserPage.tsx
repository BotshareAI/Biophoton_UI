import { useForm, Controller, useWatch } from 'react-hook-form'
import { Input } from '@renderer/components/ui/input'
import { Button } from '@renderer/components/ui/button'
import { NewUser, User } from '@shared/types/user'
import { Textarea } from '@renderer/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { Field } from '@renderer/components/layout/Field'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@renderer/components/ui/select'
import { gender, mappedGender } from '@renderer/constants/gender'
import { useState, useCallback } from 'react'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { Label } from '@renderer/components/ui/label'
import { Drawer, DrawerContent } from '@renderer/components/ui/drawer'
import Keyboard from '@renderer/components/keyboard'
import { ClipboardPlus, MoveLeft, PillBottle, UserPen } from 'lucide-react'
import { PickAvatar } from '@renderer/components/user-form/PickAvatar'
import { UsbPhotoPicker } from '@renderer/components/user-form/UsbPhotoPicker'
import { useRouter } from '@tanstack/react-router'
import clsx from 'clsx'
// import { DateInput } from '@renderer/components/ui/date-input'
import { addDateDigit, removeLastDateDigit } from '@renderer/utils/handle-date'

type AddUserPageMode = 'create' | 'edit' | 'view'

interface UserPageProps {
  mode: AddUserPageMode
  onSubmit?: (user: NewUser) => void
  onCancel?: () => void
  user?: User
}

function userSamples(blood?: boolean, saliva?: boolean, photo?: boolean): string[] {
  const arr: string[] = []
  if (blood) arr.push('blood')
  if (saliva) arr.push('saliva')
  if (photo) arr.push('photo')
  return arr
}

export function UserPage({ mode, onSubmit, onCancel, user }: UserPageProps): React.JSX.Element {
  const isReadOnly = mode === 'view'
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    control
  } = useForm<NewUser>({
    defaultValues: user
  })

  const [tab, setTab] = useState('general')
  const [open, setOpen] = useState(true)
  const [sample, setSample] = useState('')
  const [savedSamples, setSavedSamples] = useState<string[]>(
    userSamples(!!user?.blood, !!user?.saliva, !!user?.photo)
  )
  const [focusedField, setFocusedField] = useState<null | string>(null)
  const photoFile = useWatch({ control, name: 'photoFile' })
  const [pickerOpen, setPickerOpen] = useState(false)
  const [isActive, setIsActive] = useState(user?.active)

  const [pendingAvatar, setPendingAvatar] = useState<{
    root: string
    relPath: string
    previewUrl: string
  } | null>(null)

  const router = useRouter()

  const handleFocus = useCallback(
    (fieldName: string) => () => {
      setFocusedField(fieldName)
      setOpen(true)
    },
    []
  )

  const handleTabChange = useCallback((value: string) => {
    if (value === 'sample') {
      setOpen(false)
    } else {
      setOpen(true)
    }
    setTab(value)
  }, [])

  const handleSaveSample = useCallback(async (): Promise<void> => {
    await window.api.mode4Start()
    const off = window.api.onMode4Value(async ({ freqHz }) => {
      console.log('Final frequency:', freqHz, sample)
      if (sample === 'option-blood') {
        setSavedSamples((prev) => [...prev, 'blood'])
        setValue('blood', freqHz)
      } else if (sample === 'option-saliva') {
        setSavedSamples((prev) => [...prev, 'saliva'])
        setValue('saliva', freqHz)
      } else if (sample === 'option-photo') {
        setSavedSamples((prev) => [...prev, 'photo'])
        setValue('photo', freqHz)
      }
      off()
      try {
        await window.api.stop()
      } catch {
        /* empty */
      }
    })
  }, [sample, setValue])

  const setInput: React.Dispatch<React.SetStateAction<string>> = useCallback(
    (value) => {
      if (!focusedField) return
      if (typeof value === 'function') {
        const currentValue = getValues(focusedField as keyof NewUser) || ''
        setValue(focusedField as keyof NewUser, value(currentValue as string))
      } else {
        setValue(focusedField as keyof NewUser, value)
      }
    },
    [focusedField, getValues, setValue]
  )

  const handleKey = (key: string): void => {
    const currentValue = (getValues(focusedField as keyof NewUser) as string) || ''

    if (key === 'DEL') {
      setValue(focusedField as keyof NewUser, removeLastDateDigit(currentValue))
    } else if (key === 'DONE') {
      closeKeyboard()
    } else if (/^\d$/.test(key)) {
      setValue(focusedField as keyof NewUser, addDateDigit(currentValue, key))
    }
  }

  const closeKeyboard = useCallback(() => setOpen(false), [])

  const onSubmitWrapped = useCallback(
    async (data: NewUser) => {
      let nextPhotoFile = data.photoFile ?? user?.photoFile ?? null

      if (pendingAvatar) {
        // choose ONE of the strategies below:

        // (A) Immediate deletion in main: pass the old filename
        const old = user?.photoFile ?? null
        const res = await window.api.storePhoto(pendingAvatar.root, pendingAvatar.relPath, old)
        if (res?.ok) nextPhotoFile = res.file

        // (B) 2-phase delete (safer if DB can fail):
        // const res = await window.usb.storePhoto(pendingAvatar.root, pendingAvatar.relPath, null)
        // if (res?.ok) {
        //   nextPhotoFile = res.file
        //   // after onSubmit succeeds, call window.avatars.delete(old)
        // }

        // reflect in RHF state so inputs match what we submit
        setValue('photoFile', nextPhotoFile ?? undefined, { shouldDirty: true })
      }

      const final: NewUser = { ...data, photoFile: nextPhotoFile ?? undefined }

      // allow sync or async onSubmit
      await Promise.resolve(onSubmit?.(final))

      // clear pending preview on successful submit
      setPendingAvatar(null)
    },
    [user?.photoFile, pendingAvatar, onSubmit, setValue]
  )

  const renderField = (
    label: string,
    name: keyof NewUser,
    isRequired = false,
    autoFocus = false
  ): React.JSX.Element => {
    if (isReadOnly) {
      return (
        <div>
          <label className="text-sm text-secondary mb-1 block">{label}</label>
          <span>{user?.[name] || '/'}</span>
        </div>
      )
    } else {
      return (
        <Field label={label} error={errors[name]?.message}>
          <Input
            type="text"
            {...(isRequired ? register(name, { required: `${label} is requred` }) : register(name))}
            onFocus={handleFocus(name)}
            autoFocus={autoFocus}
          />
        </Field>
      )
    }
  }

  const renderDate = (label: string, name: keyof NewUser): React.JSX.Element => {
    if (isReadOnly) {
      return (
        <div>
          <label className="text-sm text-secondary mb-1 block">{label}</label>
          <span>{user?.[name] || '/'}</span>
        </div>
      )
    } else {
      return (
        <Field label={label} error={errors[name]?.message}>
          <Input
            type="text"
            // onKeyDown={handleKey}
            placeholder="MM/DD/YYYY"
            inputMode="numeric"
            autoComplete="off"
            {...register(name, { required: `${label} is requred` })}
            onChange={() => {
              /* ignore, we control value via onKeyDown */
            }}
            onFocus={handleFocus(name)}
            pattern="\d{2}/\d{2}/\d{4}"
          />
        </Field>
      )
    }
  }

  const bloodSaved = savedSamples.includes('blood')
  const salivaSaved = savedSamples.includes('saliva')
  const photoSaved = savedSamples.includes('photo')

  const sampleQuery = {
    'option-blood': bloodSaved,
    'option-saliva': salivaSaved,
    'option-photo': photoSaved
  }

  const setActive = (): void => {
    setValue('active', true)
    setIsActive(true)
  }

  const setPassive = (): void => {
    setValue('active', false)
    setIsActive(false)
  }

  return (
    <>
      <form onSubmit={isReadOnly ? (e) => e.preventDefault() : handleSubmit(onSubmitWrapped!)}>
        {mode === 'create' ? (
          <p className="text-lg font-semibold mb-2">New Client</p>
        ) : (
          <div className="flex flex-row gap-2 items-center">
            <Button variant="ghost" onClick={() => router.history.back()}>
              <MoveLeft />
            </Button>
            <p className="font-semibold">{mode === 'edit' ? 'Edit Client' : 'Client Details'}</p>
          </div>
        )}
        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="general" className="inline-flex gap-2 items-center">
              <UserPen />
              General
            </TabsTrigger>
            {/* <TabsTrigger value="location">Location</TabsTrigger> */}
            <TabsTrigger value="health" className="inline-flex gap-2 items-center">
              <ClipboardPlus />
              Main Symptoms
            </TabsTrigger>
            <TabsTrigger value="sample" className="inline-flex gap-2 items-center">
              <PillBottle />
              Sample
            </TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="flex flex-row gap-8">
            <div className="mt-4">
              <PickAvatar
                file={photoFile || user?.photoFile || null}
                previewUrl={pendingAvatar?.previewUrl ?? null}
                editable={!isReadOnly}
                onClickPick={() => setPickerOpen(true)}
              />
            </div>
            <div className="grid grid-cols-2 w-full gap-4">
              {renderField('First Name', 'firstName', true, true)}
              {renderField('Last Name', 'lastName', true)}
              {renderDate('Date of Birth', 'dateOfBirth')}
              {isReadOnly ? (
                <div>
                  <label className="text-sm text-secondary mb-1 block">Gender</label>
                  <span>{user?.gender ? mappedGender[user?.gender] : '/'}</span>
                </div>
              ) : (
                <Field label="Gender" error={errors.gender?.message}>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...register('gender', { required: 'Gender is requred' })}
                        value={field.value?.toString()}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Gender" />
                        </SelectTrigger>
                        <SelectContent>
                          {gender.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              )}
              <div className="col-span-1">
                <label className={clsx('text-sm mb-3 block', isReadOnly && 'text-secondary')}>
                  Handrod Session Type
                </label>
                {isReadOnly ? (
                  <p>{user?.active ? 'Active' : 'Passive'}</p>
                ) : (
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={isActive ? 'default' : 'outline'}
                      onClick={setActive}
                      className="flex-1 border"
                    >
                      Active
                    </Button>
                    <Button
                      type="button"
                      variant={isActive === false ? 'default' : 'outline'}
                      onClick={setPassive}
                      className="flex-1 border"
                    >
                      Passive
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="health" className="grid grid-cols-1 gap-4">
            {isReadOnly ? (
              <div>
                <label className="text-sm text-secondary mb-1 block">Main Symptoms:</label>
                <span>{user?.symptoms || '/'}</span>
              </div>
            ) : (
              <Field label="Main Symptoms:">
                <Textarea
                  {...register('symptoms')}
                  onFocus={handleFocus('symptoms')}
                  className="min-h-[120px]"
                  placeholder="Type client's symptoms here"
                  autoFocus={true}
                />
              </Field>
            )}
          </TabsContent>
          <TabsContent value="sample">
            {isReadOnly ? (
              <div>Saved samples: {savedSamples.join(', ') || '/'}</div>
            ) : (
              <>
                <Label htmlFor="sample" className="mb-4">
                  Sample Type
                </Label>
                <RadioGroup id="sample" value={sample} onValueChange={setSample}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="option-blood" id="option-blood" />
                    <Label htmlFor="option-blood">Blood{bloodSaved && ' (saved)'}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="option-saliva" id="option-saliva" />
                    <Label htmlFor="option-saliva">Saliva{salivaSaved && ' (saved)'}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="option-photo" id="option-photo" />
                    <Label htmlFor="option-photo">Photo{photoSaved && ' (saved)'}</Label>
                  </div>
                </RadioGroup>
                <p className="mt-6 text-sm">Place sample on the glass plate and click on Scan</p>
                <Button type="button" className="mt-6" onClick={handleSaveSample}>
                  {sampleQuery[sample] ? 'Rescan' : 'Scan'}
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>

        {!isReadOnly && (
          <div className="col-span-full flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">{mode == 'edit' ? 'Update' : 'Create'}</Button>
          </div>
        )}
      </form>
      {!isReadOnly && (
        <Drawer open={open} dismissible={false} modal={false}>
          <DrawerContent className="px-4 pt-1 pb-3 bg-[#e3e7e6]">
            <Keyboard
              setInput={setInput}
              onClose={closeKeyboard}
              handleKeyClick={focusedField == 'dateOfBirth' ? handleKey : undefined}
            />
          </DrawerContent>
        </Drawer>
      )}
      {!isReadOnly && (
        <UsbPhotoPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onChosen={(sel) => {
            setPendingAvatar(sel)
            setPickerOpen(false)
          }}
        />
      )}
    </>
  )
}
