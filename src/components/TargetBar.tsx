import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type RefObject,
} from 'react'
import type { Editor } from '@tiptap/core'
import {
  adjacentCharacterOnLine,
  characterInDirectionAtPoint,
  targetAtPoint,
  targetPercentForCharacter,
  updateTargetDecorations,
  type PinTarget,
} from '../lib/targeting'

type TargetBarProps = {
  editor: Editor | null
  regionRef: RefObject<HTMLDivElement | null>
  trackRef: RefObject<HTMLDivElement | null>
  pins: [PinTarget, PinTarget]
  barTop: number
  onBarTopChange: (value: number) => void
  onPinsChange: (pins: [PinTarget, PinTarget]) => void
  disabled?: boolean
}

export const MIN_BAR_TOP = 52
const BAR_HEIGHT = 24
const TARGET_OFFSET = BAR_HEIGHT + 8
const INACTIVE_ZONE_PX = 8
const KEYBOARD_BAR_STEP = 8

export function TargetBar({
  editor,
  regionRef,
  trackRef,
  pins,
  barTop,
  onBarTopChange,
  onPinsChange,
  disabled = false,
}: TargetBarProps) {
  const [inactiveEdges, setInactiveEdges] = useState<[number, number]>([0, 0])
  const [selectedControl, setSelectedControl] = useState<'bar' | 0 | 1 | null>(
    null,
  )
  const draggingPin = useRef<number | null>(null)
  const draggingBar = useRef<number | null>(null)

  useLayoutEffect(() => {
    if (!trackRef.current) return
    const track = trackRef.current
    const measureInactiveZones = () => {
      const trackWidth = track.getBoundingClientRect().width
      if (!trackWidth) return

      const edgePercent = (INACTIVE_ZONE_PX / trackWidth) * 100
      const edges: [number, number] = [edgePercent, edgePercent]
      setInactiveEdges((current) =>
        Math.abs(current[0] - edges[0]) < 0.05 &&
        Math.abs(current[1] - edges[1]) < 0.05
          ? current
          : edges,
      )
    }

    const observer = new ResizeObserver(measureInactiveZones)
    observer.observe(track)
    measureInactiveZones()
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (editor) updateTargetDecorations(editor, pins)
  }, [editor, pins])

  useEffect(() => {
    function selectControlFromEvent(event: Event) {
      const target = event.target
      const control =
        target instanceof Element
          ? target.closest<HTMLElement>('[data-keyboard-target]')
          : null
      if (!control || !trackRef.current?.contains(control)) {
        setSelectedControl(null)
        return
      }

      const value = control.dataset.keyboardTarget
      setSelectedControl(
        value === 'bar' ? 'bar' : value === 'pin-0' ? 0 : value === 'pin-1' ? 1 : null,
      )
    }

    document.addEventListener('pointerdown', selectControlFromEvent, true)
    document.addEventListener('focusin', selectControlFromEvent, true)
    return () => {
      document.removeEventListener('pointerdown', selectControlFromEvent, true)
      document.removeEventListener('focusin', selectControlFromEvent, true)
    }
  }, [trackRef])

  useEffect(() => {
    if (disabled) {
      setSelectedControl(null)
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        selectedControl === null
      ) {
        return
      }

      const focusedControl = document.activeElement
        ?.closest<HTMLElement>('[data-keyboard-target]')
        ?.dataset.keyboardTarget
      const selectedKey =
        selectedControl === 'bar' ? 'bar' : `pin-${selectedControl}`
      if (focusedControl !== selectedKey) return

      if (selectedControl === 'bar') {
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
        event.preventDefault()
        const region = regionRef.current
        const track = trackRef.current
        if (!region || !track) return

        const bounds = region.getBoundingClientRect()
        const nextTop = Math.max(
          MIN_BAR_TOP,
          Math.min(
            bounds.height - BAR_HEIGHT,
            barTop +
              (event.key === 'ArrowDown' ? KEYBOARD_BAR_STEP : -KEYBOARD_BAR_STEP),
          ),
        )
        if (nextTop === barTop) return

        onBarTopChange(nextTop)
        if (editor) {
          const trackBounds = track.getBoundingClientRect()
          const targetY = bounds.top + nextTop + TARGET_OFFSET
          onPinsChange(
            pins.map((pin) => {
              if (isInactive(pin.percent)) return { ...pin, target: null }
              const x = trackBounds.left + (trackBounds.width * pin.percent) / 100
              return { ...pin, target: targetAtPoint(editor, x, targetY) }
            }) as [PinTarget, PinTarget],
          )
        }
        return
      }

      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()
      const pin = pins[selectedControl]
      const track = trackRef.current
      const region = regionRef.current
      if (!editor || !track || !region) return

      const direction = event.key === 'ArrowLeft' ? -1 : 1
      const trackBounds = track.getBoundingClientRect()
      const currentX = trackBounds.left + (trackBounds.width * pin.percent) / 100
      const targetY =
        region.getBoundingClientRect().top + barTop + TARGET_OFFSET

      const nextTarget = pin.target
        ? adjacentCharacterOnLine(editor, pin.target, direction)
        : characterInDirectionAtPoint(editor, currentX, targetY, direction)
      if (!nextTarget) return

      const percent = targetPercentForCharacter(editor, nextTarget, track)
      if (percent === null) return

      const nextTargetX = trackBounds.left + (trackBounds.width * percent) / 100
      const resolvedTarget = pin.target
        ? nextTarget
        : targetAtPoint(editor, nextTargetX, targetY)
      const nextPins = [...pins] as [PinTarget, PinTarget]
      nextPins[selectedControl] = { percent, target: resolvedTarget }
      onPinsChange(nextPins)
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [
    barTop,
    disabled,
    editor,
    inactiveEdges,
    onBarTopChange,
    onPinsChange,
    pins,
    regionRef,
    selectedControl,
    trackRef,
  ])

  function isInactive(percent: number) {
    return percent <= inactiveEdges[0] || percent >= 100 - inactiveEdges[1]
  }

  function targetPin(index: number, percent: number, clientX: number) {
    const region = regionRef.current
    if (!editor || !region || isInactive(percent)) {
      const next = [...pins] as [PinTarget, PinTarget]
      next[index] = { percent, target: null }
      onPinsChange(next)
      return
    }

    const stageBounds = region.getBoundingClientRect()
    const targetY = stageBounds.top + barTop + TARGET_OFFSET
    const target = targetAtPoint(editor, clientX, targetY)
    const next = [...pins] as [PinTarget, PinTarget]
    next[index] = { percent, target }
    onPinsChange(next)
  }

  function handlePinDown(index: number, event: PointerEvent<HTMLButtonElement>) {
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.focus({ preventScroll: true })
    setSelectedControl(index === 0 ? 0 : 1)
    draggingPin.current = index
    const track = event.currentTarget.parentElement?.getBoundingClientRect()
    if (!track) return
    const percent = ((event.clientX - track.left) / track.width) * 100
    targetPin(index, percent, event.clientX)
  }

  function handleTrackMove(event: PointerEvent<HTMLDivElement>) {
    if (disabled) return
    const region = regionRef.current
    if (draggingBar.current !== null && region) {
      const bounds = region.getBoundingClientRect()
      const nextTop = Math.max(
        MIN_BAR_TOP,
        Math.min(
          bounds.height - BAR_HEIGHT,
          event.clientY - bounds.top - draggingBar.current,
        ),
      )
      onBarTopChange(nextTop)
      if (editor) {
        const track = event.currentTarget.getBoundingClientRect()
        const targetY = bounds.top + nextTop + TARGET_OFFSET
        onPinsChange(
          pins.map((pin) => {
            if (isInactive(pin.percent)) return { ...pin, target: null }
            const x = track.left + (track.width * pin.percent) / 100
            return { ...pin, target: targetAtPoint(editor, x, targetY) }
          }) as [PinTarget, PinTarget],
        )
      }
    }

    if (draggingPin.current !== null) {
      const track = event.currentTarget.getBoundingClientRect()
      const percent = Math.max(
        0,
        Math.min(100, ((event.clientX - track.left) / track.width) * 100),
      )
      targetPin(draggingPin.current, percent, event.clientX)
    }
  }

  function stopDragging() {
    draggingPin.current = null
    draggingBar.current = null
  }

  function handleBarDown(event: PointerEvent<HTMLDivElement>) {
    if (disabled) return
    if ((event.target as HTMLElement).closest('button')) return
    event.currentTarget.focus({ preventScroll: true })
    setSelectedControl('bar')
    event.currentTarget.setPointerCapture(event.pointerId)
    draggingBar.current = event.clientY - event.currentTarget.getBoundingClientRect().top
  }

  return (
    <div
      className={`target-bar${selectedControl === 'bar' ? ' is-keyboard-selected' : ''}`}
      ref={trackRef}
      aria-disabled={disabled}
      aria-keyshortcuts="ArrowUp ArrowDown"
      data-keyboard-target="bar"
      style={{
        top: barTop,
        '--inactive-left-width': `${inactiveEdges[0]}%`,
        '--inactive-right-width': `${inactiveEdges[1]}%`,
      } as CSSProperties}
      onPointerDown={disabled ? undefined : handleBarDown}
      onPointerMove={disabled ? undefined : handleTrackMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      role="group"
      tabIndex={disabled ? -1 : 0}
      aria-label="Character targeting bar"
    >
      <span className="inactive-zone inactive-zone-left" aria-hidden="true" />
      <span className="inactive-zone inactive-zone-right" aria-hidden="true" />
      {pins.map((pin, index) => {
        const active = !isInactive(pin.percent) && pin.target !== null
        return (
          <button
            key={index}
            type="button"
            className={`target-pin${active ? ' is-active' : ''}${selectedControl === index ? ' is-keyboard-selected' : ''}`}
            style={{ left: `${pin.percent}%` }}
            data-keyboard-target={`pin-${index}`}
            onPointerDown={disabled ? undefined : (event) => handlePinDown(index, event)}
            disabled={disabled}
            aria-keyshortcuts="ArrowLeft ArrowRight"
            aria-pressed={selectedControl === index}
            aria-label={`${index === 0 ? 'Left' : 'Right'} character target pin${active ? ', active' : ', inactive'}`}
            title={active ? 'Character target active' : 'Drag out of the red end zone to activate'}
          >
            <span className="pin-knob" />
            <span className="pin-needle" />
          </button>
        )
      })}
    </div>
  )
}
