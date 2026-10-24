type HelpPanelProps = {
  onClose: () => void
}

export function HelpPanel({ onClose }: HelpPanelProps) {
  return (
    <div className="help-backdrop" onClick={onClose}>
      <section
        id="granular-help-panel"
        className="help-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-panel-title"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose()
        }}
      >
        <div className="help-panel-header">
          <h2 id="help-panel-title">Using Granular</h2>
          <button
            className="dialog-close-button"
            type="button"
            autoFocus
            onClick={onClose}
            aria-label="Close help"
          >
            ×
          </button>
        </div>
        <ol>
          <li>
            Welcome to Granular. Type in your notes in the editor, or copy and paste from outside sources. To create paragraphs, press the <code>Enter</code> key on your keyboard. To move to a new line, press the <code>Shift+Enter</code> keys. You can format your text in the editor—<code>Ctrl+B</code> for bold, <code>Ctrl+I</code> for italics, <code>Ctrl+U</code> for underline, and opening and closing backticks (<code>``</code>) to sandwich text as inline code.
          </li>
          <li>Drag the horizontal bar onto a text line. Move either pin to target a character.</li>
          <li>Blue outlines show the targeted endpoints. One active pin targets one character; two pins include everything between them.</li>
          <li>Choose a color square, then click its matching color button beside the bar or press Enter while the page, bar, or a pin has focus to highlight the targeted range. Enter applies only when a valid target exists and does not run while the editor, title, another field, or a dialog has focus.</li>
          <li>Text formatted as inline code can also be highlighted; the code styling remains in place.</li>
          <li>Only characters on a pin's current visible line are arrow-key targets. A short line has fewer targets than a longer neighboring line; this is intentional. Left/Right stops at the first or last character and does not cross to another line or enter a red end zone. Move the bar to target another line, or drag a pin manually into a red end zone.</li>
          <li>Click or tab to a pin, then use Left/Right Arrow to move it one character on its current line. Holding an arrow repeats movement; at a red end zone, press toward the text to move to the nearest character. The bar must be aligned with a text line to activate a target.</li>
          <li>Click or tab to the bar away from its pins, then use Up/Down Arrow to move it vertically. Holding an arrow repeats movement. These keys move targeting controls only; they do not add or remove highlights.</li>
          <li>When you move the bar toward the bottom of the visible editor and more note text remains, the editor scrolls forward and the bar returns near the top so you can continue targeting without manually scrolling. The bar stays selected. Hold Page Up to focus the editor scroller while keeping the bar selected; the bar moves upward as earlier text scrolls back into view. Up/Down still move the selected bar while the scroller is focused. Releasing Page Up stops scrolling and returns focus to the bar so you can continue with the arrow keys. On keyboards that require <code>Fn</code> to send Page Up, use <code>Fn+PgUp</code>.</li>
          <li>When controls are visible and focus is outside editable fields or dialogs, use <code>Ctrl+Shift+[</code> for the left pin, <code>Ctrl+Shift+]</code> for the right pin, or <code>Ctrl+Shift+Backslash</code> for the bar (the physical backslash key may type <code>|</code> when Shift is held). On macOS, use <code>Control+Shift</code> (not Command); on Windows and Linux, use <code>Ctrl+Shift</code>. The physical positions of bracket and backslash keys vary by keyboard layout, and a browser may reserve a shortcut; clicking or tabbing to a control also selects it.</li>
          <li>Click elsewhere to deactivate targeting keyboard movement. In the note editor, arrow keys move the text cursor or scroll normally. Modified arrow shortcuts are left to your browser and operating system.</li>
          <li>Use the square-chevron buttons to decrement or increment highlighting one character at a time. Hold either button to repeat; decrement stops at the left pin. If decrement cannot act on a newly targeted range, press Increment once to establish the highlighted range, then decrement.</li>
          <li>None removes highlight color from the selected range without deleting text.</li>
          <li>Use the eye button to hide the palette and highlighting controls while keeping your note, title, app name, and Help available. Select the eye-off button to restore the controls.</li>
          <li>Your note and colors are saved in this browser and remain after refresh.</li>
          <li>
            Enjoy reading and highlighting in this Devpost <code>Build with AI: BASICS</code> proof-of-concept. We look forward to enhanced future versions with fuller note management—including a library for multiple notes, and download and share options—additional user preference settings, and other features that we hope will make Granular simpler to use yet impactful.
          </li>
          <li>
            Feel free to reach out to us at <code>feedback.granular@protonmail.com</code> to report any issues, tell us what changes you'd like to see or frictions you might be experiencing, or to simply let us know how Granular is helping you.
          </li>
        </ol>
        <button className="dialog-save help-done" type="button" onClick={onClose}>
          Done
        </button>
      </section>
    </div>
  )
}
