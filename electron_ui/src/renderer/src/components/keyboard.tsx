import { Button } from '@renderer/components/ui/button'
import { useState } from 'react'

type KeyboardProps = {
  setInput: React.Dispatch<React.SetStateAction<string>>
  onClose?: () => void
  handleKeyClick?: (key: string) => void
}

export default function Keyboard({
  setInput,
  onClose,
  handleKeyClick
}: KeyboardProps): React.JSX.Element {
  const [isUpperCase, setIsUppercase] = useState(false)
  // Define keys
  const keys = (
    isUpperCase
      ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890.,'
      : 'abcdefghijklmnopqrstuvwxyz1234567890.,'
  ).split('')
  const specialKeys = ['SPACE', 'DEL', isUpperCase ? '↓' : '↑', 'DONE']

  const handleClick = (key: string): void => {
    if (handleKeyClick) handleKeyClick(key)
    else {
      if (key === 'SPACE') {
        setInput((prev) => prev + ' ')
      } else if (key === 'DEL') {
        setInput((prev) => prev.slice(0, -1))
      } else if (key === 'DONE') {
        onClose && onClose()
      } else if (key === '↓') {
        setIsUppercase(false)
      } else if (key === '↑') {
        setIsUppercase(true)
      } else {
        setInput((prev) => prev + key)
      }
    }
  }

  const preventDefault = (
    e: React.MouseEvent<HTMLButtonElement | HTMLDivElement, MouseEvent>
  ): void => {
    e.preventDefault()
  }

  return (
    <div className="grid grid-cols-15 gap-2 w-full mt-2" onMouseDown={preventDefault} tabIndex={-1}>
      {keys.map((letter) => (
        <Button
          key={letter}
          variant="outline"
          onClick={() => handleClick(letter)}
          className="w-full border-primary"
          onMouseDown={preventDefault}
          tabIndex={-1}
        >
          {letter}
        </Button>
      ))}
      <div className="col-span-7 flex gap-2">
        {specialKeys.map((key) => (
          <Button
            key={key}
            variant="outline"
            className="border-primary"
            onClick={() => handleClick(key)}
            onMouseDown={preventDefault}
            tabIndex={-1}
          >
            {key}
          </Button>
        ))}
      </div>
    </div>
  )
}
