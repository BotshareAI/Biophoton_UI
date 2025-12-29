import { ErrorOption } from 'react-hook-form'
import { Remedy } from '@shared/types/remedy'
import { Button } from '@renderer/components/ui/button'
import { RemedyFormContent } from './RemedyFormContent'
import { useRemedyForm } from '@renderer/hooks/useRemedyForm'

export function RemedyForm({
  defaultValues,
  onSubmit,
  onCancel
}: {
  defaultValues?: Remedy
  onSubmit: (
    values: Remedy,
    setError: (key: keyof Remedy, error: ErrorOption) => void,
    onSuccess: () => void
  ) => Promise<void>
  onCancel: () => void
}): React.JSX.Element {
  const { handleSubmit, onHandleSubmit, form, categories, subcategories, meridians } =
    useRemedyForm({
      defaultValues,
      onSubmit
    })
  return (
    <form onSubmit={handleSubmit(onHandleSubmit)} className="grid grid-cols-2 gap-4">
      <RemedyFormContent
        form={form}
        categories={categories}
        subcategories={subcategories}
        meridians={meridians}
      />
      <div className="flex col-span-2 justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Update</Button>
      </div>
    </form>
  )
}
