---
doc: spec
status: approved
---

# Granular — Technical Spec

## How This Works, In Plain Language

Granular is a small browser app. React keeps the screen in sync with what the user does, TypeScript catches many code mistakes before they run, and Vite starts the app locally for development and the demo.

The note itself lives in Tiptap, an editable text area built for formatted text. Unlike a plain text box, it can attach a color mark to a precise range while still letting people type, paste, and move the cursor normally. The two pins point into that same text, so their screen positions can be translated into the characters they target.

The app keeps one current note, its title, and the user's color palette in this browser's local storage. There is no account, server, or cloud sync. A color swatch has an ID; highlights refer to that swatch, so editing its color updates text that already uses it.

This shape uses a ready-made editing engine for the difficult part—editable formatted text—and keeps the rest of the app focused on the single editor screen and its custom controls.

## The Core Journey Through the System

PRD ref: `prd.md > The Core Journey`.

1. **Open the app** → Vite serves the React app in the browser. The app loads the one-note record from local storage, or creates an empty note with the default yellow pointer bar if none exists.
2. **Edit title and text** → the title field and Tiptap editor update the current note. Tiptap keeps text and highlight marks together as words are inserted or deleted. Changes are saved back to local storage.
3. **Add a color** → the palette opens the color dialog. Preset swatches or the Hue, Saturation, and Value sliders set a preview color. Confirm adds a new color ID and filled square to the left sidebar; Cancel discards the draft color.
4. **Target text** → the user drags the horizontal bar over a line and moves one or both pins. Tiptap's view maps pin coordinates to document positions; the app shows blue outlines on the targeted endpoint characters. Two active pins define the inclusive range; one active pin defines one character.
5. **Apply or adjust** → Apply marks the full range with the active color. Increment extends the highlighted end one text character at a time; decrement removes color backward, stopping at the left pin's boundary. Holding either control repeats the action until released. New text inserted inside a highlighted passage inherits its mark.
6. **Clear** → None removes highlight marks from the active pin-bounded range without deleting text.
7. **Return later** → the app reloads the latest note title, text, highlights, and palette from local storage. A refresh is the demo check that persistence worked.

## Stack

- **React** — user interface components and screen state. [React documentation](https://react.dev/learn)
- **TypeScript** — JavaScript with type checking to catch mistakes in component and note data. [TypeScript documentation](https://www.typescriptlang.org/docs/)
- **Vite** — local development server and frontend build tool. [Vite guide](https://vite.dev/guide/)
- **Tiptap React and StarterKit** — editable rich text with document positions and marks. A small custom highlight mark stores the pointer ID and color; a custom extension handles the pointer-range actions. [Tiptap React installation](https://tiptap.dev/docs/editor/getting-started/install/react) · [Tiptap extensions](https://tiptap.dev/docs/editor/extensions/overview) · [ProseMirror coordinate API](https://prosemirror.net/docs/ref/#view.EditorView.posAtCoords)
- **Browser localStorage** — stores the latest note JSON, title, and palette on this browser only. [MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- **Custom HSV color controls** — three native range controls for Hue, Saturation, and Value, plus a small color-conversion helper; no separate color-picker dependency is needed for the prototype.

Versions should be selected by the current Vite React TypeScript starter and package manager during the first build step, then recorded in `package-lock.json`. Use a current Node.js LTS release with npm.

## Where It Runs and How Someone Tries It

- **Runtime:** browser on the learner's computer, served by Vite. It needs Node.js LTS and npm for development; the running app needs no internet service or API key.
- **Install:** from the repository root, run `npm install`.
- **Start:** run `npm run dev`, then open the local URL Vite prints (normally `http://localhost:5173`).
- **Demo recording:** open that local URL, enter a short note, demonstrate pin targeting and a multi-color range, edit or clear a highlight, then refresh to show the note still present. Record the browser screen; deployment is optional.
- **Submission reminder:** the hackathon requires a short demo video and a public GitHub repository. Local recording is sufficient; deployment does not replace either requirement.

## Look and Feel

- Use the supplied concepts as visual references: [screen 1](./images/granular_poc_screen1.svg) and [screen 2](./images/granular_poc_screen2.svg). They are references, not app runtime dependencies.
- Keep the UI spacious and editor-first, with the app name at upper left, a horizontally centered title field aligned in the same header row, storage status and Help at the right, the palette at the left, and the horizontal targeting bar resting above the editor box. Place the editor and all targeting controls close below the title field, preserving their existing relative spacing when the title is moved into the header. On narrow screens, reflow the header while keeping the title centered and controls usable.
- Fit the desktop layout within the reference 1440×667 viewport without page-level scrolling; let the editor box use the available viewport height while keeping its guidance caption below it with visible breathing room from the bottom edge. Longer note content scrolls inside the editor.
- List Ambatah first for the app name, followed by system sans-serif fallbacks. No font file is currently in the project; do not fetch a font from an external source.
- Keep the default yellow, the chosen color swatches, and the inactive red pin-end zones visually distinct. Show blue borders around the currently targeted characters before applying a highlight.
- Animate highlight application as a short, visible progression from the first pin toward the second. Keep the final mark persistent after the animation.
- Use direct, helpful copy. The Help area explains how to position the bar, target endpoints, apply or clear a range, and use increment/decrement.
- Make the editor usable at the supplied concept's desktop proportions while allowing the control layout to adapt on narrower screens.

## Components

### App Shell

Owns the single-screen layout, app name, Help entry, and top-level dialogs. It composes the editor, palette, and action controls without introducing notes-library or settings screens.

Implements `prd.md > Screens and Layout`, `prd.md > Look and Feel`, and `prd.md > Prompt and invalid-state guidance`.

### Note Title

Edits the current note title and displays “Untitled …” when the stored title is empty. Title changes update the active note record.

Implements `prd.md > Editor input and persistence`.

### Rich Text Editor

Wraps Tiptap. Supports typing, paste, normal cursor movement and text deletion, paragraphs, and highlight marks. Text edits inside a highlighted passage preserve the mark on the remaining passage and newly inserted text within it. Map the active range and endpoint pins through text-edit transactions so the pins remain aligned with the resulting highlighted boundaries.

Implements `prd.md > Editor input and persistence` and `prd.md > Highlight range selection`.

### Target Bar and Pins

Renders the horizontal bar above the editor box at rest, narrow red inactive strips at the extreme ends, and two independently draggable handles. The user can drag the bar down into the box; a pin only targets a character when its tip sits just above a text line. Maps pointer coordinates to Tiptap document positions and exposes the selected endpoint characters with blue outlines. One active pin targets a single character; two active pins target an inclusive range. Keep the endpoints in document bounds and visibly indicate inactive pins.

Implements `prd.md > Highlight range selection`.

The targeting contract uses Tiptap document positions for the start of each targeted visible character. The derived text range is half-open: it starts at the first targeted character and ends immediately after the final targeted character, so both pin targets are included. With one active pin, both range endpoints resolve to that single character. The red inactive zones are narrow strips at the extreme ends of the bar; the remaining active span extends beyond the text's inset so first and last characters can still be targeted. Character mapping compares ProseMirror caret-coordinate rectangles for each grapheme against the pin coordinates, with the editor's coordinate lookup as a tie-breaker. A target is valid only when the pin tip is within a narrow band just above or slightly into the line's caret box and horizontally overlaps a character (allowing a small tolerance for narrow glyphs); the mapper must not snap to a distant character at the end of a shorter line. Converting pointer coordinates into character positions must account for spaces, punctuation, line wrapping, and paragraph boundaries; verify this mapping before adding UI polish.

### Highlight Actions

Provides the apply-color button, None, decrement, and increment. Apply colors the full inclusive pin range. None clears the range's highlights but leaves note text intact. Increment adds the next character in the active color; decrement removes the previous character's highlight and stops at the left pin. Press-and-hold repeats with a controlled repeat rate and stops on pointer release, cancellation, or leaving the control.

Implements `prd.md > Highlight range selection` and `prd.md > Increment and decrement controls`.

Apply and None operate on the derived half-open text range. Increment and decrement traverse visible text characters, including spaces and punctuation; paragraph structure is traversed without being highlighted. The current range and pin positions are transient state; the resulting marks are part of the saved note.

### Pointer Palette and Color Dialog

Shows the default yellow pointer on first use and additional user-created color squares in the left sidebar, in rows of four. “Add pointer bar” opens a modal with preset colors and a Custom mode containing Hue, Saturation, and Value controls, plus Cancel and Add. Clicking a square makes it active. An edit affordance opens the same dialog for that square; confirming updates its color and the highlights that refer to it. Cancel leaves the current palette unchanged.

Implements `prd.md > Color pointer bars` and `prd.md > Product Decisions`.

### Help

Opens a lightweight guidance panel from the upper-right Help control. Explain the bar and pins, the blue endpoint state, range application, single-character targeting, None, and increment/decrement behavior.

Implements `prd.md > Prompt and invalid-state guidance`.

### Local Persistence

Loads and saves the single active note and palette in browser localStorage. Persist the Tiptap document as JSON so marks and text survive refresh. Report a visible problem if reading or writing storage fails; do not silently claim a save succeeded.

Implements `prd.md > Editor input and persistence` and `prd.md > States and Boundaries`.

## Data Model

One versioned local record is stored under a Granular-specific localStorage key:

```ts
type PaletteColor = {
  id: string;
  label: string;
  hex: string;
};

type SavedNote = {
  version: 1;
  title: string;
  document: JSONContent;
  palette: PaletteColor[];
  activePaletteId: string;
};
```

- On first launch, create a blank document, an “Untitled” title, one default yellow palette item, and no active highlight range. If the user clears the title, normalize it back to “Untitled” when saving.
- Tiptap JSON holds note text and inline marks with this contract: `{ type: "granularHighlight", attrs: { paletteId: string } }`. The mark stores a stable palette ID, not a copied color value. The mark renderer resolves the ID against the current palette to show the color; editing a swatch therefore updates existing text without rewriting every mark.
- Target state is held separately from the saved document: each pin is either inactive or points to a Tiptap position at the start of a visible character. A derived range uses an inclusive user-facing end and an exclusive document end. A single active pin derives a range containing just that character.
- The active target positions are transient editor state, not part of saved note content. They are recalculated as the user targets text and are not restored after refresh.
- Persist edits to the latest single note and its palette. There is no note history, multi-note collection, remote sync, or account.
- Validate the record version and required fields when loading. If stored content is invalid, show a recovery message and avoid silently overwriting the saved value.

## File Structure

Planned app files live at the repository root; existing `.agents/`, `.claude/`, `agent/`, and `devpost/` learning materials remain separate from the runtime app.

```text
Granular/
├── index.html                 # Vite page entry
├── package.json               # Scripts and app dependencies
├── package-lock.json          # Reproducible dependency versions
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite + React plugin
├── src/
│   ├── main.tsx               # React bootstrap
│   ├── App.tsx                # App shell and shared state composition
│   ├── components/
│   │   ├── NoteTitle.tsx      # Title editing
│   │   ├── NoteEditor.tsx     # Tiptap editor and highlight mark
│   │   ├── TargetBar.tsx      # Drag bar, endpoints, and character mapping
│   │   ├── HighlightActions.tsx # Apply, None, increment, decrement
│   │   ├── Palette.tsx        # Color squares and add/edit actions
│   │   ├── ColorDialog.tsx    # Preset and HSV color selection
│   │   └── HelpPanel.tsx      # Interaction guidance
│   ├── hooks/
│   │   └── useSavedNote.ts    # Load, validate, and persist one local note
│   ├── lib/
│   │   ├── highlight.ts       # Highlight mark and range operations
│   │   ├── color.ts           # HSV/RGB/hex conversion helpers
│   │   └── storage.ts         # Versioned localStorage serialization
│   └── styles.css             # Layout, typography, controls, and animation
├── devpost/                   # Planning documents and reference images
└── README.md                  # Run, test, and demo instructions
```

## External Services and Dependencies

- **No external services.** No API, database server, account, secret, or paid service is required.
- **NPM packages:** React, React DOM, Vite, TypeScript, Tiptap React, Tiptap StarterKit, and the required ProseMirror peer package(s). Package links: [React](https://www.npmjs.com/package/react), [Vite](https://www.npmjs.com/package/vite), [Tiptap React](https://www.npmjs.com/package/@tiptap/react), [Tiptap StarterKit](https://www.npmjs.com/package/@tiptap/starter-kit).
- **Browser APIs:** contenteditable/editor selection geometry and localStorage. They run locally in the browser; there are no API calls, keys, or usage costs.
- **Color math:** a small in-project HSV conversion helper; no color service or additional picker package.

## Important Failure Modes

- **Pin coordinate maps to the wrong character, especially after wrapping or around spaces** → use Tiptap/ProseMirror coordinate mapping and visibly show the activated character; verify single characters, spaces, punctuation, wrapped lines, and a paragraph boundary early in the build.
- **Text edits unexpectedly detach or lose highlight marks** → use Tiptap document marks rather than a separate stale character-index list; verify insertion and deletion inside a colored passage before building the surrounding polish.
- **Local storage is unavailable or contains invalid data** → keep the current in-memory editor usable, show an explicit save/load warning, and do not claim persistence succeeded.
- **Color is cancelled or palette color is edited** → cancellation does not add or change an item; a confirmed edit updates the selected swatch and its existing highlights together.

## What Was Simplified and Why

- **One active local note** instead of a full notes library — proves persistence without adding note selection, history, or lifecycle rules.
- **A small custom HSV picker** instead of a full design-system color library — provides the requested Hue, Saturation, and Value controls without an additional runtime dependency.
- **Palette-backed highlight marks** instead of independent arbitrary color strings — lets one palette edit recolor all existing highlights that use that pointer.
- **A short ordered reveal** instead of complex animation physics — demonstrates progressive highlighting and then stores the final range.
- **No accounts, server, or deployment** — the required demo works locally and avoids setup unrelated to the core editor.
- **Ambatah system fallback** instead of bundling a font — the current project has SVG references but no font asset.

## Decisions and Open Issues

- **Learner-approved stack:** React, TypeScript, Vite, a rich-text editor, and local browser storage. The learner accepted Tiptap as the editor because a plain text box cannot display inline colored text while preserving ordinary editing.
- **Text editing behavior:** highlights follow text through insertion and deletion inside the highlighted passage; inserted text inside the passage inherits its highlight.
- **Palette behavior:** begin with one default yellow pointer. New pointer squares are added only through the add-color dialog; editing a palette color updates highlights that refer to it.
- **Picker behavior:** include preset colors and custom Hue, Saturation, and Value controls. The HSV controls and conversion helper are implemented within the app unless the first build finds a clear need for a package.
- **Storage behavior:** save only the latest active note and its palette locally; no version history or note library.
- **Visual assets:** use the learner's SVGs as guidance and list Ambatah followed by system fallbacks; do not fetch a font.
- **Learning question clarified:** rich text differs from a basic input because it can attach a color mark to text while the user types. Tiptap supplies that editing behavior; pin-to-character positioning is the part to investigate and verify with real wrapped text and spaces early in the build.
- **Targeting contract:** each active pin identifies the start of a visible character in the Tiptap document. Two pins derive an inclusive character range, represented internally with an exclusive end boundary; one active pin derives a one-character range. Inactive red zones match the text editor's responsive horizontal padding so active pins can target the first and last text characters. Coordinate-to-position conversion must be proven with spaces, punctuation, wrapped text, and paragraph boundaries in the first build step.
- **Highlight-mark contract:** each Tiptap highlight mark stores a stable `paletteId`; the displayed color comes from the palette. Changing a palette color updates existing highlights automatically without replacing their marks.
- **Build-time character check:** confirm the mapping handles user-perceived characters, including composed or multi-code-unit characters, as one target, and test edge characters where the browser's point lookup may not return a position. If the browser/editor position model needs a conversion helper, verify it with a short test before calling precise targeting complete.
- **Approved implementation details:** precise pointer-coordinate hit testing, ordered highlight reveal, and the HSV conversion helper are build tasks within the agreed architecture; the first build step should validate coordinate mapping before surrounding polish.
- **Still to verify in the first build step:** current Node/npm versions and the exact compatible package versions. Start the project and exercise the Tiptap coordinate mapping before implementing the full interaction layer.

## Post-5-build Iteration Implementation

### Keyboard targeting and focus

- Keep the selected targeting control transient in `TargetBar`: `bar`, pin index 0 or 1, or no selection. Pointer-down selects and focuses the clicked bar or pin. A document-level pointer/focus listener clears selection when focus or pointer interaction moves outside the targeting controls; Tab focus on a targeting control may select it for keyboard users.
- Handle arrow keys only while the selected bar or pin itself is focused. Prevent the browser default only for the handled unmodified arrow key. Ignore Shift, Control, Alt, and Meta combinations so browser and OS shortcuts are not consumed. Do not handle arrow keys while the Tiptap editor, title field, Help dialog, color dialog, or other controls have focus.
- Left/Right move only the selected pin. Use grapheme ranges and rendered character rectangles to find the adjacent character on the same visual line; do not jump across a wrapped line or paragraph. At either line boundary, leave the pin on that boundary character. Update the pin percentage from the character rectangle and retain the existing blue target decoration. Arrow movement does not dispatch a highlight-mark transaction.
- When the selected pin has no target (including in a red end zone), resolve the closest rendered text line to the pin-tip height and choose the next character center in the requested horizontal direction. From the left red zone, Right reaches the first character; from the right red zone, Left reaches the last. Keep the target null while the bar tip is outside the existing vertical targeting tolerance; only its horizontal pin position changes until it is aligned with text.
- Up/Down move the selected bar by a small, bounded vertical pixel step within the existing targeting region, allowing native repeated keydown events while held. Reuse the pointer-drag pin remapping behavior after each vertical move. Do not change the established bar limits or the targeting coordinate tolerance.
- Keep pointer capture and drag handling unchanged except for selecting/focusing the control on pointer-down, so a user can switch from keyboard movement to mouse/trackpad movement without restarting the interaction.
- Add a selector-shortcut handler for Ctrl+Shift+`BracketLeft`, Ctrl+Shift+`BracketRight`, and the physical backslash key (`Backslash` or `IntlBackslash`, with `\`/`|` key-value fallbacks). Run it only when controls are visible and the active element is not an input, textarea, select, textbox, contenteditable, or dialog. Select and focus the left pin, right pin, or bar respectively; include the track itself when resolving the bar because it is the bar element, not a descendant. Unmodified arrow movement then uses the existing selected-control implementation. Preserve click/Tab selection and platform/browser defaults for all unrecognized events.
- Use Control+Shift on macOS (not Command); identify selector keys by physical key codes so shifted glyphs do not affect recognition. Physical bracket/backslash positions vary across keyboard layouts, and the browser/OS may reserve a shortcut before the app receives it. Ctrl+Shift+Page Up/Page Down can be captured by browser tab-management shortcuts, so do not use them for app selection.
- Add an Enter handler for applying the active color only when controls are visible, a valid pin-derived range exists, and focus is on the page, bar, or a pin. Use the existing apply action and animation; ignore repeat, composition, modified Enter, missing targets, and focus in the editor, title, other controls, or dialogs so normal editing and button activation are preserved.

### Visibility and icon controls

- Add a transient `showControls` UI state in the app shell. When false, do not render the color sidebar and its Add/edit controls, targeting bar and pins, range-adjust buttons, or bar actions. Keep Help, the note title, editor, app name, and an accessible visibility toggle rendered.
- Place the toggle in the reserved right-side control rail below and centered under the apply/None row; keep it reachable when controls are hidden. Use the supplied local `devpost/images/eye.svg` and `eye-off.svg` assets, descriptive accessible names, and no external icon dependency.
- Use the supplied local `square-chevron-left.svg` and `square-chevron-right.svg` assets inside the existing decrement/increment buttons. Preserve action callbacks, hold-to-repeat behavior, accessible labels, and a minimum 44px square target.
- Extend Help with concise pin/bar arrow-key instructions, same-line movement limits, ordinary editor arrow-key behavior, and hide/restore guidance.
- The toggle does not modify or persist note data. The SVG files remain local project assets.
