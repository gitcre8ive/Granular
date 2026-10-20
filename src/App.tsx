import { useCallback, useRef, useState, type CSSProperties } from 'react'
import type { Editor, JSONContent } from '@tiptap/core'
import type { Transaction } from '@tiptap/pm/state'
import { ColorDialog } from './components/ColorDialog'
import { HelpPanel } from './components/HelpPanel'
import { HoldRepeatButton } from './components/HoldRepeatButton'
import { NoteEditor } from './components/NoteEditor'
import { MIN_BAR_TOP, TargetBar } from './components/TargetBar'
import {
  applyHighlight,
  getTargetRange,
  getTextCharacterAtPosition,
  getTextCharacterAfter,
  getTextCharacterBefore,
  getTextCharacterRanges,
  type TextRange,
} from './lib/highlighting'
import {
  loadSavedNote,
  saveNote,
  type PaletteColor,
  type SavedNote,
} from './lib/storage'
import {
  targetPercentForCharacter,
  type PinTarget,
} from './lib/targeting'

const DEFAULT_PIN_RANGE: [PinTarget, PinTarget] = [
  { percent: 0, target: null },
  { percent: 100, target: null },
]

function pinForCharacter(
  editor: Editor,
  track: HTMLElement,
  character: TextRange,
): PinTarget | null {
  const target = {
    position: character.from,
    length: character.to - character.from,
  }
  const percent = targetPercentForCharacter(editor, target, track)
  return percent === null ? null : { percent, target }
}

function App() {
  const [initialLoad] = useState(loadSavedNote)
  const [note, setNote] = useState(initialLoad.note)
  const noteRef = useRef(note)
  const [editor, setEditor] = useState<Editor | null>(null)
  const [storageMessage, setStorageMessage] = useState(initialLoad.message)
  const [storageWarning, setStorageWarning] = useState(initialLoad.blocked)
  const [pins, setPins] = useState<[PinTarget, PinTarget]>(DEFAULT_PIN_RANGE)
  const [colorDialog, setColorDialog] = useState<{ colorId: string | null } | null>(
    null,
  )
  const [barTop, setBarTop] = useState(MIN_BAR_TOP)
  const [showControls, setShowControls] = useState(true)
  const [showHelp, setShowHelp] = useState(false)
  const [, setAppliedRange] = useState<TextRange | null>(null)
  const appliedRangeRef = useRef<TextRange | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const isApplyingRef = useRef(false)
  const targetingRegionRef = useRef<HTMLDivElement>(null)
  const targetTrackRef = useRef<HTMLDivElement>(null)
  const targetRange = getTargetRange(pins)

  function updateAppliedRange(range: TextRange | null) {
    appliedRangeRef.current = range
    setAppliedRange(range)
  }

  const paletteVariables = Object.fromEntries(
    note.palette.map((color) => [`--granular-color-${color.id}`, color.hex]),
  ) as CSSProperties

  const updateNote = useCallback(
    (changes: Partial<SavedNote>) => {
      const updated = { ...noteRef.current, ...changes }
      noteRef.current = updated
      setNote(updated)

      if (!initialLoad.blocked) {
        const saveMessage = saveNote(updated)
        setStorageMessage(saveMessage ?? 'Saved in this browser')
        setStorageWarning(saveMessage !== null)
      }
    },
    [initialLoad.blocked],
  )

  const updateTitle = (title: string) => updateNote({ title })

  function savePaletteColor(hex: string) {
    if (!colorDialog) return

    const currentNote = noteRef.current
    if (colorDialog.colorId) {
      const colorExists = currentNote.palette.some(
        (color) => color.id === colorDialog.colorId,
      )
      if (!colorExists) {
        setActionMessage('That palette color is no longer available.')
        setColorDialog(null)
        return
      }

      updateNote({
        palette: currentNote.palette.map((color) =>
          color.id === colorDialog.colorId ? { ...color, hex } : color,
        ),
      })
    } else {
      if (typeof window.crypto.randomUUID !== 'function') {
        setActionMessage('This browser cannot create a new color identifier.')
        return
      }

      const color: PaletteColor = {
        id: window.crypto.randomUUID(),
        label: `Color ${currentNote.palette.length + 1}`,
        hex,
      }
      updateNote({
        palette: [...currentNote.palette, color],
        activePaletteId: color.id,
      })
    }

    setColorDialog(null)
    setActionMessage(null)
  }

  const saveTitleOnBlur = () => {
    if (!noteRef.current.title.trim()) updateTitle('Untitled')
  }

  const updateContent = (
    document: JSONContent,
    transaction: Transaction,
    textChanged: boolean,
  ) => {
    updateNote({ document })
    if (!textChanged || isApplyingRef.current) return

    const currentEditor = editor
    const track = targetTrackRef.current
    if (!currentEditor || !track) {
      updateAppliedRange(null)
      return
    }

    const doc = currentEditor.state.doc
    const activeRange = appliedRangeRef.current
    if (activeRange) {
      const mappedFrom = transaction.mapping.map(activeRange.from, -1)
      const mappedTo = transaction.mapping.map(activeRange.to, 1)
      const characters = getTextCharacterRanges(
        doc,
        Math.min(mappedFrom, mappedTo),
        Math.max(mappedFrom, mappedTo),
      )
      const firstCharacter = characters[0]
      const lastCharacter = characters.at(-1)
      if (firstCharacter && lastCharacter) {
        const leftPin = pinForCharacter(currentEditor, track, firstCharacter)
        const rightPin = pinForCharacter(currentEditor, track, lastCharacter)
        if (leftPin && rightPin) {
          setPins([leftPin, rightPin])
          updateAppliedRange({
            from: firstCharacter.from,
            to: lastCharacter.to,
          })
          return
        }
      }

      updateAppliedRange(null)
    }

    setPins((currentPins) =>
      currentPins.map((pin) => {
        if (!pin.target) return pin

        const position = transaction.mapping.map(pin.target.position, 1)
        const character = getTextCharacterAtPosition(doc, position)
        if (!character) return { ...pin, target: null }

        return pinForCharacter(currentEditor, track, character) ?? {
          ...pin,
          target: {
            position: character.from,
            length: character.to - character.from,
          },
        }
      }) as [PinTarget, PinTarget],
    )
  }

  const handlePinsChange = (nextPins: [PinTarget, PinTarget]) => {
    setPins(nextPins)
    updateAppliedRange(null)
    setActionMessage(null)
  }

  async function applyCurrentHighlight() {
    if (!editor || !targetRange) {
      setActionMessage('Drag the bar to a text line and target one or two characters first.')
      return
    }

    const activeColor = note.palette.find(
      (color) => color.id === note.activePaletteId,
    )
    if (!activeColor) {
      setActionMessage('The active highlight color is unavailable. Choose a color first.')
      return
    }

    const characters = getTextCharacterRanges(
      editor.state.doc,
      targetRange.from,
      targetRange.to,
    )
    const markType = editor.schema.marks.granularHighlight
    if (!characters.length || !markType) {
      setActionMessage('No valid text range is available to highlight.')
      return
    }

    setIsApplying(true)
    isApplyingRef.current = true
    setActionMessage(null)

    try {
      const batchCount = Math.min(characters.length, 24)
      const batchSize = Math.ceil(characters.length / batchCount)
      const mark = markType.create({ paletteId: activeColor.id })

      for (let start = 0; start < characters.length; start += batchSize) {
        if (editor.isDestroyed) return

        const transaction = editor.state.tr
        for (const character of characters.slice(start, start + batchSize)) {
          transaction.addMark(character.from, character.to, mark)
        }
        if (transaction.docChanged) editor.view.dispatch(transaction)

        if (start + batchSize < characters.length) {
          await new Promise((resolve) =>
            window.setTimeout(resolve, 240 / batchCount),
          )
        }
      }

      updateAppliedRange(targetRange)
      setActionMessage('Highlight applied.')
    } finally {
      setIsApplying(false)
      isApplyingRef.current = false
    }
  }

  function incrementHighlight() {
    const range = appliedRangeRef.current ?? targetRange
    if (!editor || !range) {
      setActionMessage('Apply a highlight to the selected range before extending it.')
      return
    }

    const nextCharacter = getTextCharacterAfter(editor.state.doc, range.to)
    if (!nextCharacter) {
      setActionMessage('The highlight already reaches the end of the note.')
      return
    }

    if (!editor.schema.marks.granularHighlight) {
      setActionMessage('Highlight formatting is unavailable.')
      return
    }

    const nextRange = { from: range.from, to: nextCharacter.to }
    const firstCharacter = getTextCharacterRanges(
      editor.state.doc,
      range.from,
      editor.state.doc.content.size,
    ).find((character) => character.from === range.from)
    const track = targetTrackRef.current
    if (!firstCharacter || !track) {
      setActionMessage('The next character cannot be positioned on the target bar.')
      return
    }

    const leftTarget = {
      position: firstCharacter.from,
      length: firstCharacter.to - firstCharacter.from,
    }
    const rightTarget = {
      position: nextCharacter.from,
      length: nextCharacter.to - nextCharacter.from,
    }
    const leftPercent = targetPercentForCharacter(editor, leftTarget, track)
    const rightPercent = targetPercentForCharacter(editor, rightTarget, track)
    if (leftPercent === null || rightPercent === null) {
      setActionMessage('The next character cannot be positioned on the target bar.')
      return
    }

    applyHighlight(editor, nextRange, note.activePaletteId)
    setPins([
      { percent: leftPercent, target: leftTarget },
      { percent: rightPercent, target: rightTarget },
    ])
    updateAppliedRange(nextRange)
    setActionMessage(null)
  }

  function decrementHighlight() {
    const currentRange = appliedRangeRef.current
    if (!editor || !currentRange) {
      setActionMessage('Apply a highlight to the selected range before reducing it.')
      return
    }

    const previousCharacter = getTextCharacterBefore(editor.state.doc, currentRange.to)
    if (!previousCharacter || previousCharacter.from <= currentRange.from) {
      setActionMessage('The left pin is the decrement limit.')
      return
    }

    const markType = editor.schema.marks.granularHighlight
    if (!markType) {
      setActionMessage('Highlight formatting is unavailable.')
      return
    }

    const nextRange = { ...currentRange, to: previousCharacter.from }
    editor.view.dispatch(
      editor.state.tr.removeMark(
        previousCharacter.from,
        previousCharacter.to,
        markType,
      ),
    )
    updateAppliedRange(nextRange)
    setActionMessage(null)
  }

  function clearHighlights() {
    const range = appliedRangeRef.current ?? targetRange
    if (!editor || !range) {
      setActionMessage('Target a character range before clearing highlights.')
      return
    }

    const markType = editor.schema.marks.granularHighlight
    if (!markType) {
      setActionMessage('Highlight formatting is unavailable.')
      return
    }

    const transaction = editor.state.tr.removeMark(range.from, range.to, markType)
    if (transaction.docChanged) editor.view.dispatch(transaction)
    updateAppliedRange(null)
    setActionMessage(
      transaction.docChanged ? 'Highlights cleared.' : 'There are no highlights in this range.',
    )
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <a className="brand" href="/" aria-label="Granular home">Granular</a>
        <div
          className={`header-status${storageWarning ? ' is-warning' : ''}`}
          role="status"
          aria-live="polite"
        >
          {storageMessage ?? 'Your note is stored in this browser'}
        </div>
        <button
          className="help-button"
          type="button"
          aria-expanded={showHelp}
          aria-controls="granular-help-panel"
          onClick={() => setShowHelp(true)}
        >
          Help
        </button>
      </header>

      <div className={`workspace${showControls ? '' : ' controls-hidden'}`}>
        {showControls && (
          <aside className="palette-sidebar" aria-label="Highlight colors">
            <p className="sidebar-hint">Your colors</p>
            <div className="palette-grid">
              {note.palette.map((color) => (
                <div className="palette-item" key={color.id}>
                  <button
                    className={`palette-swatch${note.activePaletteId === color.id ? ' is-selected' : ''}`}
                    type="button"
                    aria-pressed={note.activePaletteId === color.id}
                    aria-label={`Use ${color.label} highlight color`}
                    title={`Use ${color.label}`}
                    style={{ backgroundColor: color.hex }}
                    onClick={() => updateNote({ activePaletteId: color.id })}
                  />
                  <button
                    className="palette-edit-button"
                    type="button"
                    aria-label={`Edit ${color.label} color`}
                    title={`Edit ${color.label}`}
                    onClick={() => setColorDialog({ colorId: color.id })}
                  >
                    ✎
                  </button>
                </div>
              ))}
            </div>
            <button
              className="add-color-button"
              type="button"
              onClick={() => setColorDialog({ colorId: null })}
            >
              Add pointer bar
            </button>
          </aside>
        )}

        <section className="editor-column" aria-label="Note editor">
          <label className="title-label" htmlFor="note-title">Note title</label>
          <input
            id="note-title"
            className="note-title"
            type="text"
            value={note.title}
            onChange={(event) => updateTitle(event.target.value)}
            onBlur={saveTitleOnBlur}
            placeholder="Untitled ..."
            aria-label="Note title"
          />

          <div className="editor-targeting-region" ref={targetingRegionRef}>
            {showControls && (
              <>
                <div className="target-track-area">
                  <div
                    className="range-adjust-controls"
                    style={{ top: barTop - MIN_BAR_TOP + 4 }}
                  >
                    <HoldRepeatButton
                      disabled={isApplying}
                      label="Decrement highlighted text"
                      onRepeat={decrementHighlight}
                    >
                      <img
                        src="/devpost/images/square-chevron-left.svg"
                        alt=""
                        aria-hidden="true"
                      />
                    </HoldRepeatButton>
                    <HoldRepeatButton
                      disabled={isApplying}
                      label="Increment highlighted text"
                      onRepeat={incrementHighlight}
                    >
                      <img
                        src="/devpost/images/square-chevron-right.svg"
                        alt=""
                        aria-hidden="true"
                      />
                    </HoldRepeatButton>
                  </div>
                  <TargetBar
                    editor={editor}
                    regionRef={targetingRegionRef}
                    trackRef={targetTrackRef}
                    pins={pins}
                    barTop={barTop}
                    onBarTopChange={setBarTop}
                    onPinsChange={handlePinsChange}
                    disabled={isApplying}
                  />
                </div>
                <div
                  className="bar-actions"
                  style={{ top: barTop - 7 }}
                >
                  <button
                    type="button"
                    className="apply-color-button"
                    disabled={isApplying}
                    onClick={applyCurrentHighlight}
                    aria-label="Apply highlight to the selected range"
                  >
                    <span
                      style={{
                        backgroundColor:
                          note.palette.find((color) => color.id === note.activePaletteId)?.hex ??
                          '#FFFF00',
                      }}
                    />
                  </button>
                  <button
                    type="button"
                    className="none-button"
                    disabled={isApplying}
                    onClick={clearHighlights}
                    aria-label="Clear highlights from the selected range"
                  >
                    None
                  </button>
                </div>
              </>
            )}
            <button
              type="button"
              className="control-visibility-button"
              style={{ top: barTop + 38 }}
              aria-label={showControls ? 'Hide highlight controls' : 'Show highlight controls'}
              aria-pressed={!showControls}
              title={showControls ? 'Hide highlight controls' : 'Show highlight controls'}
              onClick={() => setShowControls((visible) => !visible)}
            >
              <img
                src={`/devpost/images/${showControls ? 'eye' : 'eye-off'}.svg`}
                alt=""
                aria-hidden="true"
              />
            </button>
            <div className="editor-stage">
              <div
                className="palette-css-vars"
                style={paletteVariables}
              >
                <NoteEditor
                  content={note.document}
                  editable={!isApplying}
                  onChange={updateContent}
                  onEditorReady={setEditor}
                />
              </div>
            </div>
          </div>
          <p className="editor-caption" role="status" aria-live="polite">
            {actionMessage ?? 'Drag the horizontal bar up or down. Move a pin away from a red end to target a character.'}
          </p>
        </section>
      </div>
      {colorDialog && (
        <ColorDialog
          key={colorDialog.colorId ?? 'new-color'}
          color={
            colorDialog.colorId
              ? note.palette.find((color) => color.id === colorDialog.colorId) ?? null
              : null
          }
          onCancel={() => setColorDialog(null)}
          onSave={savePaletteColor}
        />
      )}
      {showHelp && <HelpPanel onClose={() => setShowHelp(false)} />}
    </main>
  )
}

export default App
