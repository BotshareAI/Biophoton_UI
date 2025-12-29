import { useEffect, useState } from 'react'

const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

export const Clock = (): React.JSX.Element => {
  const [now, setNow] = useState(formatDate(new Date()))

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(formatDate(new Date()))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return <span>{now}</span>
}
