export function applyDateMask(rawDigits: string): string {
  const digits = rawDigits.slice(0, 8) // mmddyyyy
  const len = digits.length

  if (len === 0) return ''

  if (len <= 2) {
    // M, MM
    return digits
  }
  if (len <= 4) {
    // MM/DD
    return `${digits.slice(0, 2)}/${digits.slice(2)}`
  }

  // MM/DD/YYYY
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function handleMonthDigit(mm: string, digit: string): string | null {
  if (mm.length === 0) {
    if (digit === '0' || digit === '1') {
      // partial month, wait for second digit
      return digit
    }
    // 2–9 → auto complete month: 3 → 03, 9 → 09
    return '0' + digit
  }

  // mm.length === 1
  const first = mm[0]

  if (first === '0') {
    // second digit: 1–9 allowed (01–09), 0 is invalid
    if (digit === '0') return null
    return first + digit
  }

  if (first === '1') {
    // second digit: 0–2 allowed (10–12)
    if (digit > '2') return null
    return first + digit
  }

  return null // shouldn't happen
}

function handleDayDigit(dd: string, digit: string): string | null {
  if (dd.length === 0) {
    if (digit >= '0' && digit <= '3') {
      return digit // partial
    }
    // 4–9 → auto 0X (e.g. 9 → 09)
    return '0' + digit
  }

  // dd.length === 1
  const first = dd[0]

  if (first === '0') {
    // 01–09
    if (digit === '0') return null // 00 invalid
    return first + digit
  }

  if (first === '1' || first === '2') {
    // 10–29
    return first + digit
  }

  if (first === '3') {
    // 30–31 only
    if (digit === '0' || digit === '1') return first + digit
    return null
  }

  return null
}

export function addDateDigit(currentValue: string, digit: string): string {
  if (!/^\d$/.test(digit)) return currentValue // only digits

  const raw = currentValue.replace(/\D/g, '') // remove /
  let mm = raw.slice(0, 2)
  let dd = raw.slice(2, 4)
  let yyyy = raw.slice(4, 8)

  // Decide which part we are filling
  if (mm.length < 2) {
    const next = handleMonthDigit(mm, digit)
    if (next == null) return currentValue // reject invalid
    mm = next
  } else if (dd.length < 2) {
    const next = handleDayDigit(dd, digit)
    if (next == null) return currentValue // reject invalid
    dd = next
  } else if (yyyy.length < 4) {
    // year: just append
    yyyy = yyyy + digit
  } else {
    // already full
    return currentValue
  }

  const newRaw = mm + dd + yyyy
  return applyDateMask(newRaw)
}

export function removeLastDateDigit(currentValue: string): string {
  const raw = currentValue.replace(/\D/g, '')
  const next = raw.slice(0, -1)
  return applyDateMask(next)
}
