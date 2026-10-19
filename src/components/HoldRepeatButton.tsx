import { useEffect, useRef, type ReactNode } from 'react'

type HoldRepeatButtonProps = {
  children: ReactNode
  disabled?: boolean
  label: string
  onRepeat: () => void
}

const INITIAL_REPEAT_DELAY = 400
const REPEAT_INTERVAL = 80

export function HoldRepeatButton({
  children,
  disabled = false,
  label,
  onRepeat,
}: HoldRepeatButtonProps) {
  const timeoutRef = useRef<number | null>(null)
  const intervalRef = useRef<number | null>(null)
  const suppressClickRef = useRef(false)
  const onRepeatRef = useRef(onRepeat)
  onRepeatRef.current = onRepeat

  function stopRepeating() {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  function handlePointerDown() {
    suppressClickRef.current = true
    onRepeatRef.current()
    timeoutRef.current = window.setTimeout(() => {
      intervalRef.current = window.setInterval(
        () => onRepeatRef.current(),
        REPEAT_INTERVAL,
      )
    }, INITIAL_REPEAT_DELAY)
  }

  function handleClick() {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    onRepeatRef.current()
  }

  function handlePointerUp() {
    stopRepeating()
    window.setTimeout(() => {
      suppressClickRef.current = false
    }, 0)
  }

  function handlePointerLeave() {
    stopRepeating()
    window.setTimeout(() => {
      suppressClickRef.current = false
    }, 0)
  }

  useEffect(() => stopRepeating, [])

  return (
    <button
      type="button"
      className="step-button"
      aria-label={label}
      disabled={disabled}
      onPointerDown={disabled ? undefined : handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={() => {
        stopRepeating()
        suppressClickRef.current = false
      }}
      onClick={handleClick}
    >
      {children}
    </button>
  )
}
