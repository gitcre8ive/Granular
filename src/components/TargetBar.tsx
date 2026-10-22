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
  editorStageRef: RefObject<HTMLDivElement | null>
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
  editorStageRef,
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
  const selectedControlRef = useRef(selectedControl)
  selectedControlRef.current = selectedControl
  const pinsRef = useRef(pins)
  pinsRef.current = pins
  const draggingPin = useRef<number | null>(null)
  const draggingBar = useRef<number | null>(null)
  const reverseScrollActive = useRef(false)
  const reverseScrollFrame = useRef<number | null>(null)
  const lastEditorScrollTop = useRef<number | null>(null)
  const barTopRef = useRef(barTop)
  barTopRef.current = barTop
  const updateTargetsAtTopRef = useRef<(top: number) => void>(() => {})

  function pinsMatch(nextPins: [PinTarget, PinTarget]) {
    return pinsRef.current.every((pin, index) => {
      const nextPin = nextPins[index]
      return (
        pin.percent === nextPin.percent &&
        pin.target?.position === nextPin.target?.position &&
        pin.target?.length === nextPin.target?.length
      )
    })
  }

  function updatePins(nextPins: [PinTarget, PinTarget]) {
    if (pinsMatch(nextPins)) return
    pinsRef.current = nextPins
    onPinsChange(nextPins)
  }

  useEffect(
    () => () => {
      reverseScrollActive.current = false
      if (reverseScrollFrame.current !== null) {
        window.cancelAnimationFrame(reverseScrollFrame.current)
      }
    },
    [],
  )

  function updateTargetsAtTop(top: number) {
    const region = regionRef.current
    const track = trackRef.current
    if (!editor || !region || !track) return

    const regionBounds = region.getBoundingClientRect()
    const trackBounds = track.getBoundingClientRect()
    const targetY = regionBounds.top + top + TARGET_OFFSET
    const currentPins = pinsRef.current
    const nextPins = currentPins.map((pin) => {
      if (isInactive(pin.percent)) return { ...pin, target: null }
      const x = trackBounds.left + (trackBounds.width * pin.percent) / 100
      return { ...pin, target: targetAtPoint(editor, x, targetY) }
    }) as [PinTarget, PinTarget]
    updatePins(nextPins)
  }
  updateTargetsAtTopRef.current = updateTargetsAtTop

  function moveBar(nextTop: number, pointerClientY?: number) {
    const region = regionRef.current
    const track = trackRef.current
    const stage = editorStageRef.current
    if (!region || !track) return

    let resolvedTop = nextTop
    const stageBounds = stage?.getBoundingClientRect()
    const lineHeight = editor
      ? Number.parseFloat(getComputedStyle(editor.view.dom).lineHeight)
      : 24
    const effectiveLineHeight = Number.isFinite(lineHeight) ? lineHeight : 24
    const regionBounds = region.getBoundingClientRect()
    const targetY = regionBounds.top + nextTop + TARGET_OFFSET
    const scrollThreshold = stageBounds
      ? stageBounds.bottom - effectiveLineHeight * 2
      : Number.NEGATIVE_INFINITY
    const requestedScroll = nextTop - MIN_BAR_TOP
    const activeTarget = pins.find((pin) => pin.target)?.target
    const targetLineTop = activeTarget && editor
      ? editor.view.coordsAtPos(activeTarget.position, 1).top
      : null
    const desiredLineTop =
      regionBounds.top + MIN_BAR_TOP + TARGET_OFFSET + 16
    const scrollToTopDistance =
      targetLineTop === null
        ? requestedScroll
        : Math.max(0, targetLineTop - desiredLineTop)
    const remainingScroll = stage
      ? stage.scrollHeight - stage.clientHeight - stage.scrollTop
      : 0

    if (
      stage &&
      requestedScroll > 0 &&
      remainingScroll > 0 &&
      targetY >= scrollThreshold
    ) {
      const scrollAmount = Math.min(scrollToTopDistance, remainingScroll)
      stage.scrollTop += scrollAmount
      resolvedTop = MIN_BAR_TOP + scrollToTopDistance - scrollAmount
      if (pointerClientY !== undefined) {
        draggingBar.current =
          pointerClientY - region.getBoundingClientRect().top - resolvedTop
      }
    }

    onBarTopChange(resolvedTop)
    updateTargetsAtTop(resolvedTop)
  }

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
    const stage = editorStageRef.current
    if (!stage) return
    lastEditorScrollTop.current = stage.scrollTop

    function handleEditorScroll() {
      if (!stage) return
      const previousScrollTop = lastEditorScrollTop.current
      const nextScrollTop = stage.scrollTop
      lastEditorScrollTop.current = nextScrollTop
      if (
        previousScrollTop === null ||
        !reverseScrollActive.current ||
        selectedControlRef.current !== 'bar'
      ) {
        return
      }

      const scrollDelta = nextScrollTop - previousScrollTop
      if (scrollDelta === 0) return

      const region = regionRef.current
      const maxBarTop = region
        ? region.getBoundingClientRect().height - BAR_HEIGHT
        : Number.POSITIVE_INFINITY
      const nextTop = Math.max(
        MIN_BAR_TOP,
        Math.min(maxBarTop, barTopRef.current + scrollDelta),
      )
      barTopRef.current = nextTop
      onBarTopChange(nextTop)
      updateTargetsAtTopRef.current(nextTop)
    }

    stage.addEventListener('scroll', handleEditorScroll, { passive: true })
    return () => stage.removeEventListener('scroll', handleEditorScroll)
  }, [editorStageRef, onBarTopChange, regionRef])

  useEffect(() => {
    function selectControlFromEvent(event: Event) {
      const target = event.target
      const control =
        target instanceof Element
          ? target.closest<HTMLElement>('[data-keyboard-target]')
          : null
      if (!control || !trackRef.current?.contains(control)) {
        if (
          event.type === 'focusin' &&
          target === editorStageRef.current &&
          selectedControlRef.current === 'bar'
        ) {
          return
        }
        reverseScrollActive.current = false
        selectedControlRef.current = null
        setSelectedControl(null)
        return
      }

      reverseScrollActive.current = false
      const value = control.dataset.keyboardTarget
      const nextSelection =
        value === 'bar' ? 'bar' : value === 'pin-0' ? 0 : value === 'pin-1' ? 1 : null
      selectedControlRef.current = nextSelection
      setSelectedControl(nextSelection)
    }

    document.addEventListener('pointerdown', selectControlFromEvent, true)
    document.addEventListener('focusin', selectControlFromEvent, true)
    return () => {
      document.removeEventListener('pointerdown', selectControlFromEvent, true)
      document.removeEventListener('focusin', selectControlFromEvent, true)
    }
  }, [editorStageRef, selectedControl, trackRef])

  useEffect(() => {
    if (disabled) {
      reverseScrollActive.current = false
      selectedControlRef.current = null
      if (reverseScrollFrame.current !== null) {
        window.cancelAnimationFrame(reverseScrollFrame.current)
        reverseScrollFrame.current = null
      }
      setSelectedControl(null)
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      const focusedControl = document.activeElement
        ?.closest<HTMLElement>('[data-keyboard-target]')
        ?.dataset.keyboardTarget

      if (
        event.key === 'PageUp' &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey &&
        selectedControl === 'bar' &&
        (focusedControl === 'bar' ||
          document.activeElement === editorStageRef.current)
      ) {
        const stage = editorStageRef.current
        if (!stage) return

        event.preventDefault()
        if (!reverseScrollActive.current) {
          reverseScrollActive.current = true
          if (document.activeElement !== stage) {
            trackRef.current?.blur()
            stage.focus()
          }
        }

        if (reverseScrollFrame.current === null && stage.scrollTop > 0) {
          let previousFrameTime: number | null = null
          const scrollUp = (time: number) => {
            if (!reverseScrollActive.current || selectedControl !== 'bar') {
              reverseScrollFrame.current = null
              return
            }

            if (previousFrameTime !== null) {
              const elapsed = Math.min((time - previousFrameTime) / 1000, 0.05)
              const scrollSpeed = Math.max(96, stage.clientHeight * 0.5)
              stage.scrollTop = Math.max(
                0,
                stage.scrollTop - scrollSpeed * elapsed,
              )
            }
            previousFrameTime = time
            reverseScrollFrame.current =
              stage.scrollTop > 0 ? window.requestAnimationFrame(scrollUp) : null
          }
          reverseScrollFrame.current = window.requestAnimationFrame(scrollUp)
        }
        return
      }

      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        selectedControl === null
      ) {
        return
      }

      const selectedKey =
        selectedControl === 'bar' ? 'bar' : `pin-${selectedControl}`
      const stageHasActiveBar =
        selectedControl === 'bar' &&
        document.activeElement === editorStageRef.current
      if (focusedControl !== selectedKey && !stageHasActiveBar) return

      if (selectedControl === 'bar') {
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
        event.preventDefault()
        const region = regionRef.current
        if (!region) return

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

        moveBar(nextTop)
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
      updatePins(nextPins)
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (
        event.key !== 'PageUp' ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        selectedControl !== 'bar' ||
        !reverseScrollActive.current
      ) {
        return
      }

      reverseScrollActive.current = false
      if (reverseScrollFrame.current !== null) {
        window.cancelAnimationFrame(reverseScrollFrame.current)
        reverseScrollFrame.current = null
      }
      trackRef.current?.focus({ preventScroll: true })
    }

    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('keyup', handleKeyUp, true)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('keyup', handleKeyUp, true)
    }
  }, [
    barTop,
    disabled,
    editor,
    editorStageRef,
    inactiveEdges,
    onBarTopChange,
    onPinsChange,
    pins,
    regionRef,
    selectedControl,
    trackRef,
  ])

  useEffect(() => {
    if (disabled) return

    function handleSelectorShortcut(event: KeyboardEvent) {
      if (
        !event.ctrlKey ||
        !event.shiftKey ||
        event.altKey ||
        event.metaKey
      ) {
        return
      }

      const activeElement = document.activeElement
      if (
        activeElement instanceof HTMLElement &&
        (activeElement.isContentEditable ||
          activeElement.matches('input, textarea, select, [role="textbox"]') ||
          activeElement.closest('[role="dialog"]'))
      ) {
        return
      }

      const target =
        event.code === 'BracketLeft'
          ? 'pin-0'
          : event.code === 'BracketRight'
            ? 'pin-1'
            : event.code === 'Backslash' ||
                event.code === 'IntlBackslash' ||
                event.key === '\\' ||
                event.key === '|'
              ? 'bar'
              : null
      if (!target) return

      const selector = `[data-keyboard-target="${target}"]`
      const track = trackRef.current
      const control = track?.matches(selector)
        ? track
        : track?.querySelector<HTMLElement>(selector)
      if (!control) return

      event.preventDefault()
      control.focus({ preventScroll: true })
      const nextSelection = target === 'bar' ? 'bar' : target === 'pin-0' ? 0 : 1
      selectedControlRef.current = nextSelection
      setSelectedControl(nextSelection)
    }

    document.addEventListener('keydown', handleSelectorShortcut, true)
    return () =>
      document.removeEventListener('keydown', handleSelectorShortcut, true)
  }, [disabled, trackRef])

  function isInactive(percent: number) {
    return percent <= inactiveEdges[0] || percent >= 100 - inactiveEdges[1]
  }

  function targetPin(index: number, percent: number, clientX: number) {
    const region = regionRef.current
    if (!editor || !region || isInactive(percent)) {
      const next = [...pins] as [PinTarget, PinTarget]
      next[index] = { percent, target: null }
      updatePins(next)
      return
    }

    const stageBounds = region.getBoundingClientRect()
    const targetY = stageBounds.top + barTop + TARGET_OFFSET
    const target = targetAtPoint(editor, clientX, targetY)
    const next = [...pins] as [PinTarget, PinTarget]
    next[index] = { percent, target }
    updatePins(next)
  }

  function handlePinDown(index: number, event: PointerEvent<HTMLButtonElement>) {
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.focus({ preventScroll: true })
    selectedControlRef.current = index === 0 ? 0 : 1
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
      moveBar(nextTop, event.clientY)
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
    selectedControlRef.current = 'bar'
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
