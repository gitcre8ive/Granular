---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [x] **1. You can edit a note and target exact characters with pins**
  Becomes usable: A locally running editor accepts typed and pasted text, saves the latest title and document locally, and lets the user drag the bar and pins to visibly target characters, including spaces and punctuation.
  Why now: Bootstrapping belongs inside the first usable slice. Pin-to-character mapping is the riskiest part of the unique kernel, so we prove it against actual editable text before building more behavior around it.
  PRD ref: `prd.md > The Core Journey` (steps 1-5), `prd.md > Editor input and persistence`, `prd.md > Highlight range selection`
  Spec ref: `spec.md > Stack`, `spec.md > Target Bar and Pins`, `spec.md > Rich Text Editor`, `spec.md > Local Persistence`, `spec.md > Data Model`, `spec.md > Where It Runs and How Someone Tries It`
  Build: Scaffold the React/TypeScript/Vite app; install Tiptap; build the single-screen layout and editable title/text area; persist one note locally; implement the horizontal bar, inactive red ends, and draggable pins with coordinate-to-character mapping and blue endpoint feedback. Keep the default yellow swatch. Use the supplied SVGs as layout guidance.
  Verify (mechanical): Run `npm run build`; confirm `curl --fail http://127.0.0.1:5173/` and `curl --fail http://127.0.0.1:5173/src/lib/targeting.ts` return the page and transformed targeting module. Pin-to-character accuracy is the learner check because it requires trying the visual controls in a browser.
  Learner check: Start the app with `npm run dev`, enter a short passage, move the bar and pins, and see the blue outline track the exact endpoint characters. Refresh and confirm the note remains.
  Commit: `Build editable note and character targeting`

- [x] **2. You can apply, extend, and clear a precise highlight**
  Becomes usable: The user applies a color to the full pin-bounded range, sees the highlight progress between endpoints, adjusts it with increment/decrement, and clears it with None without deleting text.
  Why now: Once exact targets are reliable, this slice proves the unique highlighting kernel end to end and checks that marks stay attached to text during ordinary edits.
  PRD ref: `prd.md > Highlight range selection`, `prd.md > Increment and decrement controls`, `prd.md > Editor input and persistence`
  Spec ref: `spec.md > Rich Text Editor`, `spec.md > Target Bar and Pins`, `spec.md > Highlight Actions`, `spec.md > Data Model`, `spec.md > Important Failure Modes`
  Build: Add the palette-linked Tiptap highlight mark; apply it to the inclusive pin range; support one-pin single-character mode; implement None, character-by-character increment/decrement, hold-to-repeat with a left bound, and the progressive application reveal. Confirm inserted text inside a highlight inherits the mark and deleting text preserves marks on remaining text. Persist the resulting document.
  Verify (mechanical): Run `npm run build`. Check the highlight-range and range-boundary logic with its focused checks, and verify that inserted/deleted text preserves the mark and the saved document reloads with highlights.
  Learner check: Highlight “a good” by targeting `a` and the final `d`, try increment/decrement, clear the selected range with None, then reapply a highlight and insert a word inside it. Confirm the text stays editable and the highlight follows the edited passage.
  Commit: `Add precise highlight actions`

- [ ] **3. You can add, choose, and edit highlight colors**
  Becomes usable: The default yellow pointer is joined by user-added colors; the user can activate or edit palette squares, and existing highlights update when their palette color changes.
  Why now: This adds the multi-color workflow after range highlighting works, isolating palette and mark-link behavior from the targeting risk.
  PRD ref: `prd.md > Color pointer bars`, `prd.md > Product Decisions`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Pointer Palette and Color Dialog`, `spec.md > Data Model`, `spec.md > Local Persistence`, `spec.md > Important Failure Modes`
  Build: Add the “Add pointer bar” dialog with preset choices and custom Hue/Saturation/Value sliders, preview, Add, and Cancel. Render the default color and added swatches in the left sidebar, four per row; activate a swatch on click; edit an existing swatch through the dialog and resolve highlight marks through palette IDs. Persist palette and active color alongside the note.
  Verify (mechanical): Run `npm run build`. Verify HSV-to-hex conversion and palette record loading/saving with focused checks. Confirm cancelled color changes do not modify the palette and confirmed edits recolor existing marks.
  Learner check: Add a custom color, use it to highlight a second range, switch colors from the sidebar, edit the first color, then refresh. Confirm the swatches and both existing highlight colors behave as expected.
  Commit: `Add editable pointer color palette`

- [ ] **4. You can use the complete editor and understand its controls**
  Becomes usable: The single editor screen has the approved layout, Help instructions, accessible control feedback, and explicit messages for invalid targeting or persistence errors; the core workflow is ready for a short demo.
  Why now: Complete the presentation and safeguards after the core editor works, then verify the full journey from fresh launch through refresh without reintroducing cut note-management features.
  PRD ref: `prd.md > Screens and Layout`, `prd.md > Look and Feel`, `prd.md > Prompt and invalid-state guidance`, `prd.md > States and Boundaries`, `prd.md > What We're Building`
  Spec ref: `spec.md > App Shell`, `spec.md > Help`, `spec.md > Look and Feel`, `spec.md > Important Failure Modes`, `spec.md > Where It Runs and How Someone Tries It`
  Build: Finish spacing and responsive behavior from the supplied concept references; add the top-right Help panel; show clear guidance if Apply is used with no active pin and visible warnings if local storage fails. Check keyboard-accessible controls and ensure no read-only screen, settings screen, trash, or notes library is added.
  Verify (mechanical): Run `npm run build` and all focused checks. Start with `npm run dev`, walk the complete demo journey, refresh to verify local data, and inspect browser output for runtime errors.
  Learner check: Try the app from a fresh state: enter and title a note, add and edit colors, target and highlight text, adjust and clear highlights, read Help, then refresh. Tell me what feels confusing or needs changing before final review.
  Commit: `Complete and polish editor experience`

## Hands-on Checkpoints

- [x] Early targeting behavior explored — tested both line ends, spaces, punctuation, line changes, and shorter second-line targeting; corrected vertical alignment and stopped out-of-line pins from snapping to a distant final character.
- [x] Core highlight loop explored — learner verified applying, incrementing across a wrapped line, decrementing one character, clearing with None without deleting text, and keeping the right pin aligned after inserting text inside a highlight.
- [ ] Palette behavior explored — after slice 3, add and edit colors and confirm existing highlights follow the palette changes.
- [ ] Final kick-the-tires exploration and feedback completed — after slice 4, run the complete demo journey and report problems or refinements.

## Final Review

- [ ] Final review complete — feedback resolved, affected behavior re-verified and re-tried, and learner confirms the proof of concept is ready.

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap.
- [ ] Optional edit and transfer reflection addressed — offered, declined, already covered, or not applicable.
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse.

Activity and evidence: [record actual activity, code/test/document references, and unfinished work]
Route and stops: [record actual paths and symbols; say if not toured]
Edit outcome: [tried/kept/reverted/declined/not applicable, with verification if changed]
Reflection: [offered/answered/declined/already covered; personal response belongs only in ignored learner profile]
Activity mode: [live app, static fallback, focused alternative, prior practice, or recap]

## Revisions
- Map active highlight ranges and endpoint pins through text edits — learner testing showed inserted text inherited the highlight but the endpoint pin stayed at its old document position.
- Added hands-on pauses after slices 1, 2, and 3 — the learner chose Fast mode to save time and credits while still testing the app as it is built; each pause focuses on a distinct behavior and gives feedback time to shape the remaining work.
- Narrowed the pin inactive zones to match the editor's responsive text insets — hands-on feedback showed that fixed-width end zones blocked characters near the start and end of a line.
- Added a measured-character fallback when the editor's point lookup cannot resolve a pin position near the text edges — retesting showed that the narrower red zones fixed the boundary size but did not yet activate every edge character.
- Reduced inactive zones to narrow 8px strips, letting the active span extend into the editor's text insets; hid horizontal overflow while retaining vertical scrolling — retesting still found several edge characters unreachable, and the learner requested no horizontal scrollbar.
- Changed character picking to compare the pin against actual browser text-range rectangles for each grapheme — the learner confirmed the narrow zones and no-horizontal-scroll behavior, but edge characters still did not activate, indicating coordinate-to-character mapping remained the issue.
- Returned to ProseMirror caret-coordinate rectangles after the DOM text-range change stopped all character tracking; moved the bar into a dedicated space above the editor box, shortened the pin needle to a clear target tip, and limited character feedback to pin tips just above a text line — learner feedback showed the bar should begin outside the box and should not outline text when vertically misaligned.
- Restricted horizontal targeting to characters actually under or very near each pin — hands-on testing confirmed first-line targets, but a pin beyond the end of a shorter second line incorrectly selected that line's last character.
