import { useCallback, useRef, useState, type CSSProperties } from 'react'
import type { Editor, JSONContent } from '@tiptap/core'
import { NoteEditor } from './components/NoteEditor'
import { TargetBar } from './components/TargetBar'
import { loadSavedNote, saveNote, type SavedNote } from './lib/storage'

function App() {
  const [initialLoad] = useState(loadSavedNote)
  const [note, setNote] = useState(initialLoad.note)
  const noteRef = useRef(note)
  const [editor, setEditor] = useState<Editor | null>(null)
  const [storageMessage, setStorageMessage] = useState(initialLoad.message)
  const targetingRegionRef = useRef<HTMLDivElement>(null)

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

  const updateContent = (document: JSONContent) => updateNote({ document })

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

          <div className="editor-toolbar" aria-label="Highlight controls">
            <button type="button" className="step-button" disabled aria-label="Decrement highlight, coming next">
              ‹
            </button>
            <button type="button" className="step-button" disabled aria-label="Increment highlight, coming next">
              ›
            </button>
            <span className="toolbar-note">Drag the bar into the editor; align pin tips just above a text line.</span>
            <button type="button" className="apply-color-button" disabled aria-label="Apply highlight, coming next">
              <span style={{ backgroundColor: note.palette[0]?.hex ?? '#FFFF00' }} />
            </button>
          </div>

          <div className="editor-targeting-region" ref={targetingRegionRef}>
            <TargetBar editor={editor} regionRef={targetingRegionRef} />
            <div className="editor-stage">
              <div
                className="palette-css-vars"
                style={{ '--default-yellow': note.palette[0]?.hex ?? '#FFFF00' } as CSSProperties}
              >
                <NoteEditor
                  content={note.document}
                  onChange={updateContent}
                  onEditorReady={setEditor}
                />
              </div>
            </div>
          </div>
          <p className="editor-caption">
            Drag the horizontal bar up or down. Move a pin away from a red end to target a character.
          </p>
        </section>
      </div>
    </main>
  )
}

export default App
