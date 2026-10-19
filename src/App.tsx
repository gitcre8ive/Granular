import { useCallback, useRef, useState, type CSSProperties } from 'react'
import type { Editor, JSONContent } from '@tiptap/core'
import { HoldRepeatButton } from './components/HoldRepeatButton'
import { NoteEditor } from './components/NoteEditor'
import { TargetBar } from './components/TargetBar'
import {
  applyHighlight,
  getTargetRange,
  getTextCharacterRanges,
  type TextRange,
} from './lib/highlighting'
import { loadSavedNote, saveNote, type SavedNote } from './lib/storage'
import type { PinTarget } from './lib/targeting'

const DEFAULT_PIN_RANGE: [PinTarget, PinTarget] = [
  { percent: 0, target: null },
  { percent: 100, target: null },
]

function App() {
  const [initialLoad] = useState(loadSavedNote)
  const [note, setNote] = useState(initialLoad.note)
  const noteRef = useRef(note)
  const [editor, setEditor] = useState<Editor | null>(null)
  const [storageMessage, setStorageMessage] = useState(initialLoad.message)
  const [pins, setPins] = useState<[PinTarget, PinTarget]>(DEFAULT_PIN_RANGE)
  const [barTop, setBarTop] = useState(12)
  const [appliedRange, setAppliedRange] = useState<TextRange | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const isApplyingRef = useRef(false)
  const targetingRegionRef = useRef<HTMLDivElement>(null)
  const targetRange = getTargetRange(pins)

  const paletteVariables = Object.fromEntries(
    note.palette.map((color) => [`--granular-color-${color.id}`, color.hex]),
  ) as CSSProperties

  const updateNote = useCallback(
    (changes: Partial<SavedNote>) => {
      const updated = { ...noteRef.current, ...changes }
      noteRef.current = updated
      setNote(updated)

      if (!initialLoad.blocked) {
        setStorageMessage(saveNote(updated) ?? 'Saved in this browser')
      }
    },
    [initialLoad.blocked],
  )

  const updateTitle = (title: string) => updateNote({ title })

  const saveTitleOnBlur = () => {
    if (!noteRef.current.title.trim()) updateTitle('Untitled')
  }

  const updateContent = (document: JSONContent) => {
    updateNote({ document })
    if (!isApplyingRef.current) setAppliedRange(null)
  }

  const handlePinsChange = (nextPins: [PinTarget, PinTarget]) => {
    setPins(nextPins)
    setAppliedRange(null)
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

      setAppliedRange(targetRange)
      setActionMessage('Highlight applied.')
    } finally {
      setIsApplying(false)
      isApplyingRef.current = false
    }
  }

  function incrementHighlight() {
    const range = appliedRange ?? targetRange
    if (!editor || !range) {
      setActionMessage('Apply a highlight to the selected range before extending it.')
      return
    }

    const nextCharacter = getTextCharacterRanges(
      editor.state.doc,
      range.to,
      editor.state.doc.content.size,
    )[0]
    if (!nextCharacter) {
      setActionMessage('The highlight already reaches the end of the note.')
      return
    }

    if (!editor.schema.marks.granularHighlight) {
      setActionMessage('Highlight formatting is unavailable.')
      return
    }

    applyHighlight(editor, { from: range.from, to: nextCharacter.to }, note.activePaletteId)
    setAppliedRange({ from: range.from, to: nextCharacter.to })
    setActionMessage(null)
  }

  function decrementHighlight() {
    if (!editor || !appliedRange) {
      setActionMessage('Apply a highlight to the selected range before reducing it.')
      return
    }

    const characters = getTextCharacterRanges(
      editor.state.doc,
      appliedRange.from,
      appliedRange.to,
    )
    const lastCharacter = characters.at(-1)
    if (!lastCharacter || lastCharacter.from <= appliedRange.from) {
      setActionMessage('The left pin is the decrement limit.')
      return
    }

    const markType = editor.schema.marks.granularHighlight
    if (!markType) {
      setActionMessage('Highlight formatting is unavailable.')
      return
    }

    editor.view.dispatch(
      editor.state.tr.removeMark(
        lastCharacter.from,
        lastCharacter.to,
        markType,
      ),
    )
    setAppliedRange({ ...appliedRange, to: lastCharacter.from })
    setActionMessage(null)
  }

  function clearHighlights() {
    const range = appliedRange ?? targetRange
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
    setAppliedRange(null)
    setActionMessage(
      transaction.docChanged ? 'Highlights cleared.' : 'There are no highlights in this range.',
    )
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <a className="brand" href="/" aria-label="Granular home">Granular</a>
        <div className="header-status" role="status" aria-live="polite">
          {storageMessage ?? 'Your note is stored in this browser'}
        </div>
        <button className="help-button" type="button" disabled aria-label="Help, coming in a later build step">
          Help
        </button>
      </header>

      <div className="workspace">
        <aside className="palette-sidebar" aria-label="Highlight colors">
          <button
            className="palette-swatch is-selected"
            type="button"
            aria-pressed="true"
            aria-label="Default yellow highlight color"
            title="Default yellow"
            style={{ backgroundColor: note.palette[0]?.hex ?? '#FFFF00' }}
          />
          <p className="sidebar-hint">Your colors</p>
        </aside>

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
            <div
              className="range-adjust-controls"
              style={{ top: Math.max(0, barTop - 52) }}
            >
              <HoldRepeatButton
                disabled={isApplying}
                label="Decrement highlighted text"
                onRepeat={decrementHighlight}
              >
                ‹
              </HoldRepeatButton>
              <HoldRepeatButton
                disabled={isApplying}
                label="Increment highlighted text"
                onRepeat={incrementHighlight}
              >
                ›
              </HoldRepeatButton>
              <button
                type="button"
                className="none-button"
                disabled={isApplying}
                onClick={clearHighlights}
                aria-label="Clear highlights from the selected range"
              >
                None
              </button>
              <button
                type="button"
                className="apply-color-button"
                disabled={isApplying}
                onClick={applyCurrentHighlight}
                aria-label="Apply highlight to the selected range"
              >
                <span style={{ backgroundColor: note.palette[0]?.hex ?? '#FFFF00' }} />
              </button>
            </div>

            <TargetBar
              editor={editor}
              regionRef={targetingRegionRef}
              pins={pins}
              barTop={barTop}
              onBarTopChange={setBarTop}
              onPinsChange={handlePinsChange}
              disabled={isApplying}
            />
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
    </main>
  )
}

export default App
