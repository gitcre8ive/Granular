---
doc: prd
status: approved
---

# Granular — Product Requirements

Granular is a local note editor designed for precise, low-friction text highlighting, built around a single editor surface and text-aware pointer controls. Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`, and `scope.md > The POC Boundary`.

## The Core Journey

1. The user opens Granular and sees a focused editor with a note title field at the top, a large text area underneath, and a highlighting control area aligned above or within the editor.
2. The user types or pastes a short note into the editor. The text remains visible in the main editor and remains available in local browser storage after refresh.
3. The user sees a default active highlight color in the main controls. Additional pointer bars appear in the left sidebar only after the user chooses the "Add pointer bar" action, selects a color in the modal, and confirms it.
4. The user drags the horizontal target bar down over the note and positions the two pins at the start and end characters of the range they want to highlight.
5. The user sees the start and end characters become visibly activated with blue borders, indicating the range is ready.
6. The user clicks the color-apply button beside the bar. The selected color fills the complete span between the pins, including the endpoints and any spaces in between.
7. The user may change the active color, adjust the range by moving one or both pins, or use increment/decrement controls to extend or remove the highlight by one character at a time.
8. The user may also click a "None" control to remove a range instantly when they want to clear a highlight without using the decrement button.
9. The user can continue revising the note and leave the editor knowing the content persists locally. The proof of success is a visible highlight range that can be changed and remains after refresh.

## Screens and Layout

Granular is intentionally a single-screen editor for this proof of concept.

- Header: app name at the left, centered note-title field with placeholder “Untitled …”, storage status, and Help at the right. On narrow screens, the header may wrap while keeping the title centered and controls usable.
- Center: a large text editor box sized to allow comfortable reading and editing of a short note. It should use more of the available viewport height while keeping the guidance caption beneath it visibly above the bottom edge.
- Above the editor box at rest: a horizontal target bar spanning most of the editor width, with two control pins descending from it. The user can drag the bar down into the box and align the pin tips just above a text line.
- Keep the editor box and targeting controls close beneath the header title field; moving the title into the header raises the editor and control group together without changing their relative spacing.
- Left sidebar: a stack of color-filled pointer bars, arranged in rows of four, representing the active and available highlight colors.
- Right side of the target bar: a color-apply button for the currently selected pointer bar, plus the “Add pointer bar” control for creating more colors.
- A small prompt or instructional message appears if no valid range is active, guiding the user to drag the bar and aim the pins before applying a highlight.

## Look and Feel

- The interface should feel direct and precise rather than generic or cluttered.
- Typography is intentionally clean and strong, with the app title set in Ambatah for distinct product identity.
- The editing area should feel generous: large enough to read and highlight text comfortably without tiny selection targets.
- Highlight colors should be obvious and distinct, with each pointer bar represented by its own filled square in the left sidebar after the user adds it through the modal flow.
- The left sidebar should begin mostly empty in the default state, with the default active color as the only default pointer bar shown when the app opens.
- The active selection should be visible through a blue border on the target characters before the highlight is applied.
- The highlight motion should feel smooth and unmistakable when the range is applied, with no confusion about what was selected.
- The app is functional and practical rather than decorative; the product identity comes from the interaction, not from a showroom design.
- A Help button or panel should be available in the top-right area to explain the bar, pins, color controls, and range behavior quickly without trial and error.

## Features and Behavior

### Editor input and persistence

- The user can type or paste a short note into the main editor box.
- The note title can be edited in the title field; if blank, it is saved as “Untitled”.
- The user can click away from the title field to save it.
- The editor content is retained in local browser storage and remains after a refresh.
- For the prototype, the last edited version of the active note is the version stored locally; there is no full note-library flow yet.
- The app should allow ordinary system text editing and deletion behavior to continue without conflicting with the highlight layer.
- The user can apply and remove highlights on inline-code-formatted text while its code styling remains intact.
- When text is inserted or deleted inside an applied highlight, the active range and endpoint pins stay aligned with the resulting highlighted text; inserted text inherits the mark.

### Highlight range selection

- The horizontal target bar starts above the editor box and can be dragged down into the box, with the pin tips positioned just above the active text line.
- The two pins can be dragged independently along the bar to target specific characters.
- A pin in the red inactive region at either end is inactive; when moved away from it, it becomes active and can target a character.
- The selected range is defined by the positions of the two active pins.
- When a pin tip is positioned just above a valid text line and targets a character, that character appears with a blue activation border; pins away from a line do not show a character target.
- The active color button applies the currently selected color to the full span between the pins, including the endpoints, any spaces in the range, and inline-code-formatted text without removing its code styling.
- A single active pin with the other end inactive can highlight a single character.
- The active "None" control can clear an already-highlighted range instantly when the user wants to remove those highlights without using the decrement controls.

### Increment and decrement controls

- The decrement button removes highlight coverage one character backward at a time.
- The increment button extends highlight coverage one character forward at a time.
- Holding either button speeds up the action.
- This process continues through the text range and across line breaks when the range reaches the end of a line, so a user can continue highlighting across multiple lines without resetting the range.
- A decrement cannot extend beyond the user-defined left bound. The user must reposition the first pin if they want to remove a highlight farther left.

### Color pointer bars

- The user can create new pointer bars using the “Add pointer bar” action.
- Adding a pointer bar opens a modal color selector with a cancel option and, for the prototype, a custom color workflow with preset hues and a custom mode using Hue, Saturation, and Value controls.
- A selected color appears as a filled square in the left sidebar.
- Clicking any color-filled sidebar item activates that color as the current pointer bar and the associated highlight behavior.
- If the user edits or customizes a color in place, the change should update the sidebar square and the current active color immediately.
- The left sidebar organizes the bars in rows of four, keeping the most recent additions easy to locate.
- The default state should have a single default color in the left sidebar; additional colors are added only when the user chooses them.

### Prompt and invalid-state guidance

- If no valid range is active and the user clicks the color-apply button, the app should not highlight the entire document or do something unpredictable.
- Instead, the user sees a clear instruction: drag the bar to the text, target the start and end characters, or leave a single pin active to highlight a single character.
- This prompt should be concise, visible, and directly actionable.
- A Help panel or Help button should explain the bar, pins, range behavior, and the None/clear action so the user can learn the interaction without much trial and error.

## States and Boundaries

- **First use** — A fresh editor opens with a default yellow active highlight color, a blank note title, and no active range until the user positions the pins.
- **Idle editor** — The user sees the note, title field, target bar, and controls. No text is highlighted until a valid range is selected.
- **Range ready** — The user has two active pins or one active pin and an inactive end. The selected range is visible via blue borders on the endpoint characters.
- **Highlight applied** — The chosen color fills the range and stays visible until removed or replaced.
- **Highlight cleared** — The user clicks the None control, which instantly clears the selected range regardless of its color.
- **Increment/decrement adjustment** — A highlight expands or contracts by one character at a time, with the visible range updating immediately.
- **Invalid range** — No valid highlight target has been set. The app shows a brief, clear prompt instead of applying anything broadly.
- **Local persistence** — The note title and body remain available in local storage after the page reloads, with the last saved version of the active note retained.

## Product Decisions

- The editor-first scope is intentional: it demonstrates the premium interaction without turning into a full notes app. This keeps the proof of concept realistic for a short build and a short demo.
- The left sidebar is the main way to switch colors because it makes the current highlight workflow visible and immediate, but it is not pre-populated beyond the default pointer bar in the empty state.
- The user adds additional pointer bars through the modal flow, so the color system feels like an editable app rather than a hard-coded panel.
- The blue border state is the most important feedback signal: it tells the user exactly which characters are selected before the highlight is applied.
- The app keeps the highlight range precise, even when the user uses fast increment/decrement control, because the experience is about control rather than conventional selection.
- The app supports a custom color selector with Hue, Saturation, and Value controls and keeps the options editable in place where feasible.
- A None control should instantly clear a selected range so users do not have to rely on decrement alone.
- The product must remain local-first to match the learner’s goal of keeping notes accessible without a complicated sync system.

## What We're Building

- One editor surface with a title field and a large text area.
- A target bar and two draggable pins for character-level range selection.
- A visible activation state for the selected characters.
- A color-apply action that highlights the full range between the pins.
- A default active color plus additional pointer bars added by the user through the modal flow.
- A way to add and switch among multiple colors, including a custom color selector with Hue, Saturation, and Value controls where feasible.
- Increment and decrement highlight controls that expand or shrink the selected range by character.
- A None control to clear a selected highlight range instantly.
- Local persistence of the note content and title, storing the latest version of the active note.
- Invalid-range guidance instead of an unpredictable “do nothing” state.
- Help guidance accessible from the top-right area of the editor.

## Deferred From the POC

- Dedicated read-only note view.
- Settings screen.
- Trash screen and any restoration flow.
- Notes selection, list/grid organization, batch editing, or deletion.
- Permanent deletion and expiry rules.
- Multi-note management beyond the core editor demonstration.

## Possible Later Enhancements

- Saveable note library with grid/list browsing.
- Read-only review mode for notes after editing.
- More advanced color management and pointer-bar editing.
- Undo/redo for editing and highlighting actions.
- Auto-save status feedback and richer note metadata.

## Non-Goals

- A full document-management app with folders, organization systems, and multi-note workflows.
- Full trash and restore logic for many notes.
- Read-only review and settings screens during the prototype.
- Rich collaboration or sync features.

## Open Questions

- The custom color selector is now a preferred part of the prototype, provided it does not materially extend the build beyond the proof-of-concept goal.
- Custom colors should be editable in-place where feasible, not only through the modal.
- The instruction prompt should be replaced by a Help area in the top-right, with quick guidance for the user instead of a temporary message.
- Local persistence is a single active note state for the prototype, storing the latest version of the note in browser storage and preserving the last edited version after refresh.
- These are resolved enough to proceed into the technical spec without changing the core proof-of-concept boundary.

## Post-5-build Iteration Requirements

This addition extends the completed editor workflow without changing the existing note, highlight, palette, or persistence requirements.

### Keyboard targeting

- Clicking or focusing a pin selects that pin. Left Arrow and Right Arrow move only that pin by one user-perceived text character on its current visible line; repeated keydown events while held continue moving it. The pin stops at the first or last character on that line rather than jumping to another line.
- If the selected pin has no current character target, including while in a red end zone, the arrow key can still move it toward the nearest character on the closest visible line. Moving inward from a red zone reaches the first/last character; if the bar is outside the text-targeting vertical band, the pin stays inactive until aligned with text.
- Clicking or focusing the horizontal bar away from its pins selects the bar. Up Arrow and Down Arrow move the bar vertically within the targeting area and update the pin targets for the new height; holding a key repeats movement.
- Keyboard pin movement changes only pin positions and target feedback. It does not apply, extend, decrement, or clear highlights. The existing apply, increment, decrement, and None actions retain their behavior.
- Mouse and trackpad dragging remain usable after keyboard movement and can continue from the current position.
- Clicking or moving focus to another control, the note title, the editor, or elsewhere deactivates targeting selection. Arrow keys then keep their ordinary browser/editor behavior, including text cursor movement and scrolling.
- Arrow commands are handled only when the corresponding targeting control has focus. Do not intercept modified arrow shortcuts (Shift, Control, Alt, or Meta); no platform-specific modifier is required. The browser/operating-system key-repeat behavior provides held-key repetition across Windows, macOS, and Linux.
- When the bar reaches the lower two visible text lines and more editor content can scroll into view, automatically scroll the editor forward and return the bar near its upper targeting position. Keep the targeted text line below the pin tip so it is not obscured, and keep the bar focused and selected during this transition. When the user holds Page Up while the bar is selected, focus the editor scroller while retaining the bar's active selection; each repeated keypress moves the bar upward and scrolls earlier text into view together. Keep the bar selected in the scroller-focused state; releasing Page Up stops the motion and returns focus to the bar for continued arrow-key movement. Never reverse automatically at the end of the note. Apply forward auto-scroll during both keyboard bar movement and pointer dragging; stop advancing when the editor has reached its end.

### Target-selection shortcuts

- When highlight controls are visible and focus is outside the note title, note editor, other editable fields, and dialogs, Ctrl+Shift+[ selects the left pin, Ctrl+Shift+] selects the right pin, and Ctrl+Shift+Backslash selects the bar (the shifted key may be reported as `|` by some layouts). The user then moves the selected pin with unmodified Left/Right or the bar with unmodified Up/Down.
- Identify the bracket shortcuts by physical `BracketLeft` and `BracketRight` key codes so they do not depend on whether the shifted character is printed as `[` or `{`; document that physical bracket locations vary on non-US layouts.
- On Windows and Linux use Ctrl+Shift; on macOS use Control+Shift, not Command+Shift. Do not intercept these shortcuts while an editable element has focus or while the controls are hidden. Prevent default only after a recognized shortcut is received by the page.
- Browser/OS shortcuts can take precedence before a web page receives a key event; the app does not guarantee interception in every browser configuration. Keep click/Tab selection as the reliable fallback.

### Keyboard highlight application

- With a valid one-character or two-pin target and controls visible, pressing Enter while focus is on the page, target bar, or a pin applies the active color to the targeted range, matching the color-apply button.
- Do not intercept Enter while the title, editor, another editable field, or a dialog has focus. Require a target and do not repeatedly start the highlight animation from a held Enter key.

### Control visibility and icons

- A persistent-on-screen visibility toggle switches between the supplied eye and eye-off icons. Hiding removes the palette's color controls, Add pointer bar, targeting bar and pins, decrement/increment controls, apply-color button, and None action from view and interaction.
- While controls are hidden, the Granular name, note title and field, Help button, visibility toggle, and editable note remain available. Help explains how to restore controls and use keyboard targeting. Visibility is transient UI state and does not alter saved note data.
- Replace the increment/decrement text glyphs with the supplied square-chevron SVGs. Both buttons keep their current actions and hold behavior, remain clearly visible, and provide a finger-friendly target of at least 44 by 44 CSS pixels.
