import { Mark, mergeAttributes } from '@tiptap/core'
import type { Editor } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { PinTarget } from './targeting'

export type TextRange = {
  from: number
  to: number
}

export const GranularHighlight = Mark.create({
  name: 'granularHighlight',
  inclusive: true,

  addAttributes() {
    return {
      paletteId: {
        default: 'default-yellow',
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-palette-id') ?? 'default-yellow',
        renderHTML: (attributes: { paletteId: string }) => ({
          'data-palette-id': attributes.paletteId,
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-palette-id]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const paletteId = String(
      HTMLAttributes['data-palette-id'] ?? 'default-yellow',
    ).replace(/[^a-zA-Z0-9_-]/g, '')

    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        class: 'granular-highlight',
        style: `background-color: var(--granular-color-${paletteId || 'default-yellow'}, #ffff00)`,
      }),
      0,
    ]
  },
})

export function getTargetRange(pins: PinTarget[]): TextRange | null {
  const targets = pins.flatMap(({ target }) => (target ? [target] : []))
  if (!targets.length) return null

  const from = Math.min(...targets.map(({ position }) => position))
  const to = Math.max(...targets.map(({ position, length }) => position + length))
  return { from, to }
}

export function getTextCharacterRanges(
  doc: ProseMirrorNode,
  from = 0,
  to = doc.content.size,
): TextRange[] {
  const ranges: TextRange[] = []
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

  doc.descendants((node, nodePosition) => {
    if (!node.isText || !node.text) return

    for (const { segment, index } of segmenter.segment(node.text)) {
      const start = nodePosition + index
      const end = start + segment.length
      if (start >= from && end <= to) ranges.push({ from: start, to: end })
    }
  })

  return ranges
}

export function getTextCharacterAfter(
  doc: ProseMirrorNode,
  position: number,
): TextRange | null {
  const next = getTextCharacterRanges(doc, position, doc.content.size)
  return next[0] ?? null
}

export function getTextCharacterBefore(
  doc: ProseMirrorNode,
  position: number,
): TextRange | null {
  const previous = getTextCharacterRanges(doc, 0, position)
  return previous.at(-1) ?? null
}

export function getTextCharacterAtPosition(
  doc: ProseMirrorNode,
  position: number,
): TextRange | null {
  const characters = getTextCharacterRanges(doc)
  return (
    characters.find(({ from, to }) => from <= position && position < to) ??
    characters.find(({ from }) => from >= position) ??
    characters.at(-1) ??
    null
  )
}

export function applyHighlight(editor: Editor, range: TextRange, paletteId: string) {
  const markType = editor.schema.marks.granularHighlight
  if (!markType) return false

  const mark = markType.create({ paletteId })
  const characters = getTextCharacterRanges(editor.state.doc, range.from, range.to)
  if (!characters.length) return false

  const transaction = editor.state.tr
  for (const character of characters) {
    transaction.addMark(character.from, character.to, mark)
  }
  if (!transaction.docChanged) return false

  editor.view.dispatch(transaction)
  return true
}
