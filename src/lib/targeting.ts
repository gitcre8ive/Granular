import { Extension, type Editor } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { getTextCharacterRanges } from './highlighting'

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

export function adjacentCharacterOnLine(
  editor: Editor,
  target: Target,
  direction: -1 | 1,
): Target | null {
  const characters = getTextCharacterRanges(editor.state.doc)
  const currentIndex = characters.findIndex(
    (character) => character.from === target.position,
  )
  if (currentIndex < 0) return null

  const current = characters[currentIndex]
  const currentRect = characterRect(editor, current.from, current.to)
  const currentCenterY = (currentRect.top + currentRect.bottom) / 2
  const lineCharacters = characters
    .map((character) => ({
      character,
      rect: characterRect(editor, character.from, character.to),
    }))
    .filter(
      ({ rect }) =>
        Math.abs((rect.top + rect.bottom) / 2 - currentCenterY) <= 2,
    )
    .sort((left, right) => left.rect.left - right.rect.left)
  const lineIndex = lineCharacters.findIndex(
    ({ character }) => character.from === current.from,
  )
  if (lineIndex < 0) return null
  const adjacent = lineCharacters[lineIndex + direction]
  return adjacent
    ? {
        position: adjacent.character.from,
        length: adjacent.character.to - adjacent.character.from,
      }
    : null
}

export function characterInDirectionAtPoint(
  editor: Editor,
  x: number,
  y: number,
  direction: -1 | 1,
): Target | null {
  const characters = getTextCharacterRanges(editor.state.doc)
  const measured = characters.map((character) => ({
    character,
    rect: characterRect(editor, character.from, character.to),
  }))
  const closest = measured.reduce<(typeof measured)[number] | null>(
    (best, candidate) => {
      if (!best) return candidate
      const bestDistance =
        y < best.rect.top
          ? best.rect.top - y
          : y > best.rect.bottom
            ? y - best.rect.bottom
            : 0
      const candidateDistance =
        y < candidate.rect.top
          ? candidate.rect.top - y
          : y > candidate.rect.bottom
            ? y - candidate.rect.bottom
            : 0
      return candidateDistance < bestDistance ? candidate : best
    },
    null,
  )
  if (!closest) return null

  const lineCenterY = (closest.rect.top + closest.rect.bottom) / 2
  const lineCharacters = measured
    .filter(
      ({ rect }) =>
        Math.abs((rect.top + rect.bottom) / 2 - lineCenterY) <= 2,
    )
    .sort(
      (left, right) =>
        (left.rect.left + left.rect.right) / 2 -
        (right.rect.left + right.rect.right) / 2,
    )
  const exactIndex = lineCharacters.findIndex(
    ({ rect }) => Math.abs((rect.left + rect.right) / 2 - x) <= 2,
  )
  let nextIndex = exactIndex >= 0 ? exactIndex + direction : -1
  if (exactIndex < 0 && direction > 0) {
    nextIndex = lineCharacters.findIndex(
      ({ rect }) => (rect.left + rect.right) / 2 > x,
    )
  } else if (exactIndex < 0) {
    for (let index = lineCharacters.length - 1; index >= 0; index -= 1) {
      const centerX =
        (lineCharacters[index].rect.left + lineCharacters[index].rect.right) / 2
      if (centerX < x) {
        nextIndex = index
        break
      }
    }
  }
  const next = lineCharacters[nextIndex]
  return next
    ? {
        position: next.character.from,
        length: next.character.to - next.character.from,
      }
    : null
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

export function targetPercentForCharacter(
  editor: Editor,
  target: Target,
  track: HTMLElement,
): number | null {
  const bounds = track.getBoundingClientRect()
  if (!bounds.width) return null

  const rect = characterRect(editor, target.position, target.position + target.length)
  const centerX = (rect.left + rect.right) / 2
  return ((centerX - bounds.left) / bounds.width) * 100
}
