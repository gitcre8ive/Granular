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
  targetAtPoint,
  updateTargetDecorations,
  type PinTarget,
} from '../lib/targeting'

type TargetBarProps = {
  editor: Editor | null
  regionRef: RefObject<HTMLDivElement | null>
}

const BAR_HEIGHT = 24
const TARGET_OFFSET = BAR_HEIGHT + 8
const INACTIVE_ZONE_PX = 8

export function TargetBar({ editor, regionRef }: TargetBarProps) {
  const [barTop, setBarTop] = useState(12)
  const [inactiveEdges, setInactiveEdges] = useState<[number, number]>([0, 0])
  const [pins, setPins] = useState<[PinTarget, PinTarget]>([
    { percent: 0, target: null },
    { percent: 100, target: null },
  ])
  const trackRef = useRef<HTMLDivElement>(null)
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

  function isInactive(percent: number) {
    return percent <= inactiveEdges[0] || percent >= 100 - inactiveEdges[1]
  }

  function targetPin(index: number, percent: number, clientX: number) {
    const region = regionRef.current
    if (!editor || !region || isInactive(percent)) {
      setPins((current) =>
        current.map((pin, pinIndex) =>
          pinIndex === index ? { percent, target: null } : pin,
        ) as [PinTarget, PinTarget],
      )
      return
    }

    const stageBounds = region.getBoundingClientRect()
    const targetY = stageBounds.top + barTop + TARGET_OFFSET
    const target = targetAtPoint(editor, clientX, targetY)
    setPins((current) =>
      current.map((pin, pinIndex) =>
        pinIndex === index ? { percent, target } : pin,
      ) as [PinTarget, PinTarget],
    )
  }

  function handlePinDown(index: number, event: PointerEvent<HTMLButtonElement>) {
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    draggingPin.current = index
    const track = event.currentTarget.parentElement?.getBoundingClientRect()
    if (!track) return
    const percent = ((event.clientX - track.left) / track.width) * 100
    targetPin(index, percent, event.clientX)
  }

  function handleTrackMove(event: PointerEvent<HTMLDivElement>) {
    const region = regionRef.current
    if (draggingBar.current !== null && region) {
      const bounds = region.getBoundingClientRect()
      const nextTop = Math.max(
        0,
        Math.min(
          bounds.height - BAR_HEIGHT,
          event.clientY - bounds.top - draggingBar.current,
        ),
      )
      setBarTop(nextTop)
      if (editor) {
        const track = event.currentTarget.getBoundingClientRect()
        const targetY = bounds.top + nextTop + TARGET_OFFSET
        setPins((current) =>
          current.map((pin) => {
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
    if ((event.target as HTMLElement).closest('button')) return
    event.currentTarget.setPointerCapture(event.pointerId)
    draggingBar.current = event.clientY - event.currentTarget.getBoundingClientRect().top
  }

  return (
    <div
      className="target-bar"
      ref={trackRef}
      style={{
        top: barTop,
        '--inactive-left-width': `${inactiveEdges[0]}%`,
        '--inactive-right-width': `${inactiveEdges[1]}%`,
      } as CSSProperties}
      onPointerDown={handleBarDown}
      onPointerMove={handleTrackMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      role="group"
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
            className={`target-pin${active ? ' is-active' : ''}`}
            style={{ left: `${pin.percent}%` }}
            onPointerDown={(event) => handlePinDown(index, event)}
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
