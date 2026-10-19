import { useState } from 'react'
import type { PaletteColor } from '../lib/storage'
import { hexToHsv, hsvToHex, PRESET_COLORS } from '../lib/color'

type ColorDialogProps = {
  color: PaletteColor | null
  onCancel: () => void
  onSave: (hex: string) => void
}

export function ColorDialog({ color, onCancel, onSave }: ColorDialogProps) {
  const [hsv, setHsv] = useState(() =>
    hexToHsv(color?.hex ?? PRESET_COLORS[0].hex),
  )
  const [hex, setHex] = useState(color?.hex ?? PRESET_COLORS[0].hex)
  const [showCustom, setShowCustom] = useState(color !== null)

  function updateHsv(field: keyof typeof hsv, value: number) {
    const updated = { ...hsv, [field]: value }
    setHsv(updated)
    setHex(hsvToHex(updated))
    setShowCustom(true)
  }

  return (
    <div className="dialog-backdrop" onClick={onCancel}>
      <section
        className="color-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="color-dialog-title"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onCancel()
        }}
      >
        <div className="color-dialog-header">
          <h2 id="color-dialog-title">
            {color ? `Edit ${color.label}` : 'Add pointer bar'}
          </h2>
          <button
            className="dialog-close-button"
            type="button"
            onClick={onCancel}
            aria-label="Cancel and close"
          >
            ×
          </button>
        </div>

        <div className="preset-colors" aria-label="Preset colors">
          {PRESET_COLORS.map((preset, index) => (
            <button
              key={preset.hex}
              className={`preset-color${!showCustom && hex === preset.hex ? ' is-selected' : ''}`}
              type="button"
              autoFocus={index === 0}
              aria-label={preset.label}
              aria-pressed={!showCustom && hex === preset.hex}
              title={preset.label}
              style={{ backgroundColor: preset.hex }}
              onClick={() => {
                setHsv(hexToHsv(preset.hex))
                setHex(preset.hex)
                setShowCustom(false)
              }}
            />
          ))}
        </div>

        <button
          className={`custom-color-choice${showCustom ? ' is-selected' : ''}`}
          type="button"
          aria-pressed={showCustom}
          onClick={() => setShowCustom(true)}
        >
          Custom
        </button>

        {showCustom && (
          <div className="hsv-controls">
            <label>
              Hue <output>{Math.round(hsv.hue)}°</output>
              <input
                type="range"
                min="0"
                max="359"
                value={hsv.hue}
                onChange={(event) => updateHsv('hue', Number(event.target.value))}
              />
            </label>
            <label>
              Saturation <output>{Math.round(hsv.saturation)}%</output>
              <input
                type="range"
                min="0"
                max="100"
                value={hsv.saturation}
                onChange={(event) =>
                  updateHsv('saturation', Number(event.target.value))
                }
              />
            </label>
            <label>
              Value <output>{Math.round(hsv.value)}%</output>
              <input
                type="range"
                min="0"
                max="100"
                value={hsv.value}
                onChange={(event) => updateHsv('value', Number(event.target.value))}
              />
            </label>
          </div>
        )}

        <div className="color-preview-row">
          <span>Preview</span>
          <span
            className="color-preview"
            style={{ backgroundColor: hex }}
            aria-label={`Color preview ${hex}`}
          />
          <output>{hex}</output>
        </div>

        <div className="color-dialog-actions">
          <button type="button" className="dialog-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="dialog-save"
            onClick={() => onSave(hex)}
          >
            {color ? 'Save color' : 'Add color'}
          </button>
        </div>
      </section>
    </div>
  )
}
