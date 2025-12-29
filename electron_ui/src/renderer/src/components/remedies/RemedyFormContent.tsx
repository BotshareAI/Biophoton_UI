import { Field } from '@renderer/components/layout/Field'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { Input } from '@renderer/components/ui/input'
import { Remedy } from '@shared/types/remedy'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@renderer/components/ui/select'
import { Textarea } from '@renderer/components/ui/textarea'
import { MultiSelect } from '../ui/multi-select'
import { Category } from '@shared/types/category'
import { Subcategory } from '@shared/types/subcategory'
import { MeridianSelect } from '@shared/types/meridian'

export function RemedyFormContent({
  form,
  categories,
  subcategories,
  meridians,
  handleFocus,
  autoFocus = false
}: {
  form: UseFormReturn<Remedy>
  categories: Category[]
  subcategories: Subcategory[]
  meridians: MeridianSelect[]
  autoFocus?: boolean
  handleFocus?: (field: string) => () => void
}): React.JSX.Element {
  const {
    register,
    formState: { errors },
    control
  } = form
  const categoryId = form.watch('categoryId')
  return (
    <>
      <div className="col-span-2">
        <Field label="Name" error={errors.name?.message}>
          <Input
            {...register('name', { required: 'Remedy name is required' })}
            onFocus={handleFocus && handleFocus('name')}
            autoFocus={autoFocus}
          />
        </Field>
      </div>
      <Field label="Category" error={errors.categoryId?.message}>
        <Controller
          name="categoryId"
          control={control}
          render={({ field }) => (
            <Select value={field.value?.toString()} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>
      <Field label="Subcategory" error={errors.subcategoryId?.message}>
        <Controller
          name="subcategoryId"
          control={control}
          render={({ field }) => (
            <Select value={field.value?.toString()} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Subcategory" />
              </SelectTrigger>
              <SelectContent>
                {subcategories
                  .filter((s) => !categoryId || s.category_id == categoryId)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>
      <div className="col-span-2 flex flex-col gap-4">
        <Field label="Meridian" error={errors.meridianIds?.message}>
          <Controller
            name="meridianIds"
            control={control}
            render={({ field }) => (
              <MultiSelect
                options={meridians}
                value={field.value}
                defaultValue={field.value || []}
                onValueChange={field.onChange}
                placeholder="Select meridians"
                hideSelectAll={true}
                searchable={false}
              />
            )}
          />
        </Field>
        <Field label="Components" error={errors.components?.message}>
          <Input {...register('components')} onFocus={handleFocus && handleFocus('components')} />
        </Field>
        <Field label="Description" error={errors.description?.message}>
          <Textarea
            {...register('description')}
            onFocus={handleFocus && handleFocus('description')}
          />
        </Field>
      </div>
    </>
  )
}
