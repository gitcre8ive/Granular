import type { JSONContent } from '@tiptap/core'

export type PaletteColor = {
  id: string
  label: string
  hex: string
}

export type SavedNote = {
  version: 1
  title: string
  document: JSONContent
  palette: PaletteColor[]
  activePaletteId: string
}

export const STORAGE_KEY = 'granular:active-note:v1'

export function createEmptyNote(): SavedNote {
  return {
    version: 1,
    title: 'Untitled',
    document: {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    },
    palette: [{ id: 'default-yellow', label: 'Yellow', hex: '#FFFF00' }],
    activePaletteId: 'default-yellow',
  }
}

function isSavedNote(value: unknown): value is SavedNote {
  if (!value || typeof value !== 'object') return false
  const note = value as Partial<SavedNote>
  return (
    note.version === 1 &&
    typeof note.title === 'string' &&
    !!note.document &&
    Array.isArray(note.palette) &&
    note.palette.every(
      (color) =>
        !!color &&
        typeof color.id === 'string' &&
        typeof color.label === 'string' &&
        typeof color.hex === 'string',
    ) &&
    typeof note.activePaletteId === 'string'
  )
}

export function loadSavedNote(): { note: SavedNote; blocked: boolean; message: string | null } {
  let raw: string | null
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return {
      note: createEmptyNote(),
      blocked: true,
      message: 'Browser storage is unavailable. Your edits will not be saved.',
    }
  }

  if (raw === null) {
    return { note: createEmptyNote(), blocked: false, message: null }
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isSavedNote(parsed)) throw new Error('The saved note has an unexpected format.')
    return { note: parsed, blocked: false, message: null }
  } catch {
    return {
      note: createEmptyNote(),
      blocked: true,
      message: 'The saved note could not be read. Existing browser data was left unchanged.',
    }
  }
}

export function saveNote(note: SavedNote): string | null {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(note))
    return null
  } catch {
    return 'Could not save to browser storage. Keep this tab open to avoid losing the current edits.'
  }
}
