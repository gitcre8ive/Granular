import { Extension, type Editor } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export type Target = {
  position: number
  length: number
}

export type PinTarget = {
  percent: number
  target: Target | null
}

const targetDecorationsKey = new PluginKey<DecorationSet>('granular-targets')

export const TargetDecorations = Extension.create({
  name: 'granularTargets',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: targetDecorationsKey,
        state: {
          init: () => DecorationSet.empty,
          apply(transaction, decorations) {
            const updated = decorations.map(transaction.mapping, transaction.doc)
            return transaction.getMeta(targetDecorationsKey) ?? updated
          },
        },
        props: {
          decorations(state) {
            return targetDecorationsKey.getState(state)
          },
        },
      }),
    ]
  },
})

function characterRect(editor: Editor, from: number, to: number) {
  const startRect = editor.view.coordsAtPos(from, 1)
  const endRect = editor.view.coordsAtPos(to, -1)
  return {
    left: Math.min(startRect.left, endRect.left),
    right: Math.max(startRect.right, endRect.right),
    top: Math.min(startRect.top, endRect.top),
    bottom: Math.max(startRect.bottom, endRect.bottom),
  }
}

export function updateTargetDecorations(editor: Editor, targets: PinTarget[]) {
  const decorations = targets.flatMap(({ target }) => {
    if (!target) return []
    const from = target.position
    const to = from + target.length
    if (from < 0 || to > editor.state.doc.content.size) return []
    return [Decoration.inline(from, to, { class: 'granular-target-character' })]
  })

  editor.view.dispatch(
    editor.state.tr.setMeta(
      targetDecorationsKey,
      DecorationSet.create(editor.state.doc, decorations),
    ),
  )
}

export function targetAtPoint(editor: Editor, x: number, y: number): Target | null {
  const view = editor.view
  const hit = view.posAtCoords({ left: x, top: y })
  const ABOVE_LINE_TOLERANCE = 18
  const CARET_BOX_OVERLAP = 8
  const HORIZONTAL_TARGET_TOLERANCE = 4

  const candidates: { target: Target; score: number }[] = []
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

  editor.state.doc.descendants((node, nodePosition) => {
    if (!node.isText || !node.text) return

    for (const { segment, index } of segmenter.segment(node.text)) {
      const from = nodePosition + index
      const to = from + segment.length
      const rect = characterRect(editor, from, to)
      const { left, right, top } = rect
      const horizontalDistance =
        x < left ? left - x : x > right ? x - right : 0
      if (horizontalDistance > HORIZONTAL_TARGET_TOLERANCE) continue
      if (y < top - ABOVE_LINE_TOLERANCE || y > top + CARET_BOX_OVERLAP) continue
      const score =
        horizontalDistance +
        Math.max(top - y, 0) * 2 +
        (hit ? Math.abs(from - hit.pos) * 0.01 : 0)

      candidates.push({ target: { position: from, length: segment.length }, score })
    }
  })

  return candidates.reduce<{ target: Target; score: number } | null>(
    (best, candidate) => (!best || candidate.score < best.score ? candidate : best),
    null,
  )?.target ?? null
}
