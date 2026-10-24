import { THEME_OPTIONS, type ThemePreference } from '../lib/settings'

type SettingsDialogProps = {
  theme: ThemePreference
  onThemeChange: (theme: ThemePreference) => void
  onClose: () => void
}

export function SettingsDialog({
  theme,
  onThemeChange,
  onClose,
}: SettingsDialogProps) {
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <section
        id="granular-settings-dialog"
        className="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose()
        }}
      >
        <div className="color-dialog-header">
          <h2 id="settings-dialog-title">Settings</h2>
          <button
            className="dialog-close-button"
            type="button"
            autoFocus
            onClick={onClose}
            aria-label="Close settings"
          >
            ×
          </button>
        </div>
        <fieldset className="theme-options">
          <legend>Appearance</legend>
          {THEME_OPTIONS.map((option) => (
            <label className="theme-choice" key={option.id}>
              <input
                type="radio"
                name="granular-theme"
                value={option.id}
                checked={theme === option.id}
                onChange={() => onThemeChange(option.id)}
              />
              <span
                className="theme-swatch"
                style={{ background: option.swatch }}
                aria-hidden="true"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>
      </section>
    </div>
  )
}
