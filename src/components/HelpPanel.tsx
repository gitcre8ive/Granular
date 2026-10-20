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
          <li>Choose a color square, then click its matching color button beside the bar to highlight the range.</li>
          <li>Click or tab to a pin, then use Left/Right Arrow to move it one character on its current line. Holding an arrow repeats movement; at a red end zone, press toward the text to move to the nearest character. The bar must be aligned with a text line to activate a target.</li>
          <li>Click or tab to the bar away from its pins, then use Up/Down Arrow to move it vertically. Holding an arrow repeats movement. These keys move targeting controls only; they do not add or remove highlights.</li>
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
