import { useEffect } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import type { Editor as TiptapEditor, JSONContent } from '@tiptap/core'
import { GranularHighlight } from '../lib/highlighting'
import { TargetDecorations } from '../lib/targeting'

type NoteEditorProps = {
  content: JSONContent
  editable: boolean
  onChange: (content: JSONContent) => void
  onEditorReady: (editor: TiptapEditor | null) => void
}

export function NoteEditor({
  content,
  editable,
  onChange,
  onEditorReady,
}: NoteEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, GranularHighlight, TargetDecorations],
    content,
    editable,
    editorProps: {
      attributes: {
        class: 'note-editor',
        'aria-label': 'Note text',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor: updatedEditor }) => onChange(updatedEditor.getJSON()),
  })

  useEffect(() => {
    onEditorReady(editor)
    return () => onEditorReady(null)
  }, [editor, onEditorReady])

  useEffect(() => {
    editor?.setEditable(editable)
  }, [editor, editable])

  return <EditorContent editor={editor} />
}
