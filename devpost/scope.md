---
doc: scope
status: approved
---

# Granular

A local note editor built around precise, low-friction, multicolor text highlighting.

## The Unique Kernel
Granular makes it possible to apply or remove a highlight one character at a time, including spaces and inline-code-formatted text, instead of relying only on conventional text selection. A movable bar with character-target pins lets the user mark the start and end of a range; clicking the active color button applies that color to the entire range between the pins. Highlighting inline code preserves its code styling. Colored pointer bars in a sidebar make switching highlight colors immediate and visible.

## Who It's For
The learner is the first person who wants to try Granular; students are the first broader audience they picture, followed by teachers. A student could use it to emphasize and revisit parts of copied reading or their own notes.

## The Core Loop
In the editor, a person types or pastes a short note, chooses a color-filled pointer bar in the left sidebar, and positions the drag bar and pins over the text. The pin endpoints show as activated, then clicking the color button beside the bar applies that color to the whole range between them, including the endpoint characters and any spaces. They can also incrementally extend or decrement to remove highlighting one character at a time, switch to another color when useful, and leave the editor knowing the note is retained locally.

## Inspiration & Identity
A focused editor where the highlighting controls are part of the work surface, not an obstacle to it. The interaction should feel direct and controlled: pins target characters, and holding an increment or decrement control visibly advances or removes the highlight.

## Why This Matters to the Learner
The learner wants to make highlighting more convenient and expressive for people who enjoy emphasizing text for learning and reference. They also want to get better at reasonable scoping and finish a complete, working app.

## What "Working" Looks Like
In a short demo, the learner enters a small passage, positions the two pins at the start and end characters of a range, and clicks the active color button to highlight the entire span between them (including spaces). For example, in “Obi is a good boy.”, the left pin targets the character “a” and the right pin targets the final “d” in “good”; clicking the color button highlights “a good”, including the space between them. They switch to another color using its filled sidebar box and incrementally extend or remove highlighting by character. The work remains available in local browser storage. The visible, progressive highlight movement is the “oh, that's cool” moment.

## The POC Boundary
Build the editor mode only: a short editable note, a small set of distinct color options with add/activate pointer bars shown as color-filled boxes in the left sidebar, the movable drag bar and character-target pins, and a separate color button beside the bar that applies the active color to the entire range bracketed by the pins. Activated pin endpoints are visibly marked; the applied range includes the endpoints, any spaces between them, and inline-code-formatted text without removing its code styling. Incremental controls provide character-by-character extension and removal, including across lines, with visible progressive movement and local persistence. The POC should demonstrate changing colors by selecting the sidebar boxes; it does not need a read-only note screen or a full notes-management area.

## Later
- A saved-notes library with list or grid arrangement, a read-only view, and a trash/restore flow.
- More complete pointer-bar management, such as editing and deleting bars.
- Undo and a polished save-status indicator.

## Explicitly Cut
- **Trash and note restoration/deletion:** outside the editor-focused proof of concept.
- **Read-only screen and saved-notes library:** not needed to demonstrate the editor interaction; local persistence is enough for this demo.
- **Hide-pointer-bar/eye control:** the learner decided it does not add enough to the core idea.

## Post-5-build Iteration

This approved, controlled extension preserves the completed proof of concept and its existing scope while making the controls easier to operate during ordinary writing and the demo.

- The selected pin can move left or right one visible text character at a time with the keyboard arrow keys. Holding a key repeats movement. Pin motion only changes targeting; it never applies, extends, or removes a highlight. Movement stops at the first or last character on the current rendered line.
- If a selected pin has no active character target (including in either red end zone), Left/Right still moves it toward the nearest character on the closest visible text line. Moving inward from a red zone reaches that line's first or last character; the pin remains visually inactive while the bar is outside the normal text-targeting band.
- The selected horizontal bar can move up or down with the keyboard arrow keys; holding a key repeats movement. Its pins retarget at the new bar height. Existing mouse and trackpad dragging remain available and can be used immediately after keyboard movement.
- Clicking a pin selects it for horizontal keyboard movement. Clicking the bar outside its pins selects the bar for vertical keyboard movement. Clicking or focusing elsewhere deactivates the selection. Arrow commands are handled only while the corresponding targeting control is selected and focused, so ordinary editor cursor movement and page/editor scrolling remain available.
- With controls visible and focus outside editable fields and dialogs, Ctrl+Shift+[ (physical `BracketLeft`) selects the left pin, Ctrl+Shift+] (`BracketRight`) selects the right pin, and Ctrl+Shift+Backslash (physical `Backslash`/`IntlBackslash`) selects the bar. On some layouts the shifted key value is `|`. These shortcuts select controls; the existing unmodified arrow keys still move them. Use Control (not Command) on macOS. Browser/OS-reserved shortcuts may not reach the app, and bracket/backslash key positions vary by keyboard layout.
- With a valid one-character or two-pin target, pressing Enter while focus is on the page, bar, or a pin applies the active highlight color. Enter does not apply while the title, editor, another field, or a dialog has focus, preserving ordinary text entry.
- A visibility toggle hides and restores the palette and its add/edit controls, target bar and pins, increment/decrement controls, and apply/None actions. The app name, note title, Help access, and editable note remain visible. Visibility is a temporary screen preference, not note data.
- Replace the text glyphs on increment/decrement with the supplied Lucide square-chevron icons while preserving their existing actions and hold-to-repeat behavior.

The previous cut of the hide-pointer-bar/eye control remains as planning history; this iteration explicitly supersedes that decision for the demo and ongoing product.
