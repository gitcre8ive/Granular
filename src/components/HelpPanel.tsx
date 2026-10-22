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
          <li>Drag the horizontal bar onto a text line. Move either pin to target a character.</li>
          <li>Blue outlines show the targeted endpoints. One active pin targets one character; two pins include everything between them.</li>
          <li>Choose a color square, then click its matching color button beside the bar or press Enter while the page, bar, or a pin has focus to highlight the targeted range. Enter applies only when a valid target exists and does not run while the editor, title, another field, or a dialog has focus.</li>
          <li>Text formatted as inline code can also be highlighted; the code styling remains in place.</li>
          <li>Click or tab to a pin, then use Left/Right Arrow to move it one character on its current line. Holding an arrow repeats movement; at a red end zone, press toward the text to move to the nearest character. The bar must be aligned with a text line to activate a target.</li>
          <li>Click or tab to the bar away from its pins, then use Up/Down Arrow to move it vertically. Holding an arrow repeats movement. These keys move targeting controls only; they do not add or remove highlights.</li>
          <li>When you move the bar toward the bottom of the visible editor and more note text remains, the editor scrolls forward and the bar returns near the top so you can continue targeting without manually scrolling. The bar stays selected. Hold Page Up to focus the editor scroller while keeping the bar selected; the bar moves upward as earlier text scrolls back into view. Up/Down still move the selected bar while the scroller is focused. Releasing Page Up stops scrolling and returns focus to the bar so you can continue with the arrow keys.</li>
          <li>When controls are visible and focus is outside editable fields or dialogs, use Ctrl+Shift+[ for the left pin, Ctrl+Shift+] for the right pin, or Ctrl+Shift+Backslash for the bar (the physical backslash key may type | when Shift is held). On macOS, use Control+Shift (not Command); on Windows and Linux, use Ctrl+Shift. The physical positions of bracket and backslash keys vary by keyboard layout, and a browser may reserve a shortcut; clicking or tabbing to a control also selects it.</li>
          <li>Click elsewhere to deactivate targeting keyboard movement. In the note editor, arrow keys move the text cursor or scroll normally. Modified arrow shortcuts are left to your browser and operating system.</li>
          <li>Use the square-chevron buttons to decrement or increment highlighting one character at a time. Hold either button to repeat; decrement stops at the left pin.</li>
          <li>None removes highlight color from the selected range without deleting text.</li>
          <li>Use the eye button to hide the palette and highlighting controls while keeping your note, title, app name, and Help available. Select the eye-off button to restore the controls.</li>
          <li>Your note and colors are saved in this browser and remain after refresh.</li>
        </ol>
        <button className="dialog-save help-done" type="button" onClick={onClose}>
          Done
        </button>
      </section>
    </div>
  )
}
