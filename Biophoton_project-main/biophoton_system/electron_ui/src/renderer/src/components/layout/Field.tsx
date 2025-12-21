import clsx from 'clsx'

export function Field({
  label,
  error,
  children,
  className,
  labelClassName
}: {
  label: string
  error?: string
  children: React.ReactNode
  className?: string
  labelClassName?: string
}): React.JSX.Element {
  return (
    <div className={className}>
      <label className={clsx('text-sm mb-1 block', labelClassName)}>{label}</label>
      {children}
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  )
}
