import { ErrorOption, useForm, UseFormHandleSubmit, UseFormReturn } from 'react-hook-form'
import { Remedy } from '@shared/types/remedy'
import { useCategoriesStore } from '@renderer/store/categoriesStore'
import { Category } from '@shared/types/category'
import { Subcategory } from '@shared/types/subcategory'
import { MeridianSelect } from '@shared/types/meridian'

export function useRemedyForm({
  defaultValues,
  onSubmit
}: {
  defaultValues?: Remedy
  onSubmit: (
    values: Remedy,
    setError: (key: keyof Remedy, error: ErrorOption) => void,
    onSuccess: () => void
  ) => Promise<void>
}): {
  handleSubmit: UseFormHandleSubmit<Remedy, Remedy>
  onHandleSubmit: (remedy: Remedy) => void
  form: UseFormReturn<Remedy>
  categories: Category[]
  subcategories: Subcategory[]
  meridians: MeridianSelect[]
} {
  const categories = useCategoriesStore((s) => s.categories)
  const subcategories = useCategoriesStore((s) => s.subcategories)
  const meridians = useCategoriesStore((s) => s.meridians)
  const form = useForm<Remedy>({
    defaultValues: defaultValues ?? {
      name: '',
      category: '',
      subcategory: '',
      meridians: [],
      meridianIds: [],
      frequency: 0,
      description: '',
      components: ''
    }
  })
  const { handleSubmit, reset, setError } = form
  const onSuccess = (): void => {
    reset()
  }
  const onHandleSubmit = (remedy: Remedy): void => {
    onSubmit(
      {
        ...remedy,
        category: categories.filter((c) => c.id == remedy.categoryId)[0].name,
        subcategory: subcategories.filter((c) => c.id == remedy.subcategoryId)[0].name,
        meridians: meridians.filter((c) => remedy.meridianIds.includes(c.value)).map((m) => m.label)
      },
      setError,
      onSuccess
    )
  }

  return {
    handleSubmit,
    onHandleSubmit,
    form,
    categories,
    subcategories,
    meridians
  }
}
