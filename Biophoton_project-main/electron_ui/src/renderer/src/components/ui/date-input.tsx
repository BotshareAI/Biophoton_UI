import { applyDateMask } from '@renderer/utils/handle-date'
import { useState } from 'react'
import { Input } from './input'

type DateInputProps = {
  value?: string // "MM/DD/YYYY"
  onChange?: (value: string) => void
  onValidDateChange?: (date: Date | null) => void // null if invalid/incomplete
  onFocus: () => void
}

const DATE_MASK_LENGTH = 10 // MM/DD/YYYY

export function DateInput({
  value: controlledValue,
  onChange,
  // onValidDateChange,
  onFocus
}: DateInputProps): React.JSX.Element {
  const [internalValue, setInternalValue] = useState('')

  const value = controlledValue ?? internalValue

  const setValue = (next: string): void => {
    if (next.length > DATE_MASK_LENGTH) return
    if (controlledValue === undefined) {
      setInternalValue(next)
    }
    onChange?.(next)

    // const date = parseMaskedDate(next)
    // onValidDateChange?.(date)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const rawDigits = e.target.value.replace(/\D/g, '') // only digits
    const masked = applyDateMask(rawDigits)
    setValue(masked)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    // Optional: prevent letters and special chars from being typed
    if (e.key.length === 1 && !/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete') {
      e.preventDefault()
    }
  }

  return (
    <Input
      type="text"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder="MM/DD/YYYY"
      inputMode="numeric"
      autoComplete="off"
      pattern="\d{2}/\d{2}/\d{4}"
      onFocus={onFocus}
      required
    />
  )
}
