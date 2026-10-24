export const THEME_OPTIONS = [
  { id: 'system', label: 'System', swatch: 'linear-gradient(90deg, #f6f7f7 50%, #172328 50%)' },
  { id: 'dark', label: 'Dark', swatch: '#172328' },
  { id: 'light-skin', label: 'Light Skin', swatch: '#fdf5e2' },
  { id: 'pastel-pink', label: 'Pastel Pink', swatch: '#ffdee2' },
  { id: 'mint-green', label: 'Mint Green', swatch: '#9fcdb1' },
  { id: 'light-cream', label: 'Light Cream', swatch: '#e5e3d9' },
  { id: 'almond', label: 'Almond', swatch: '#ede0d4' },
  { id: 'light-cyan', label: 'Light Cyan', swatch: '#e3ffff' },
  { id: 'starry-night', label: 'Starry Night', swatch: 'linear-gradient(135deg, #15233b, #d1a759)' },
  { id: 'bench-wood-1', label: 'Bench Wood 1', swatch: 'linear-gradient(135deg, #76543a, #d4b38e)' },
] as const

export type ThemePreference = (typeof THEME_OPTIONS)[number]['id']

export const THEME_PREFERENCE_KEY = 'granular:theme-preference:v1'

export function isThemePreference(value: unknown): value is ThemePreference {
  return THEME_OPTIONS.some((option) => option.id === value)
}

export function loadThemePreference(): {
  theme: ThemePreference
  message: string | null
} {
  let raw: string | null
  try {
    raw = window.localStorage.getItem(THEME_PREFERENCE_KEY)
  } catch {
    return {
      theme: 'system',
      message: 'Theme preference could not be read. System appearance is active.',
    }
  }

  if (raw === null) return { theme: 'system', message: null }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'version' in parsed &&
      parsed.version === 1 &&
      'theme' in parsed &&
      isThemePreference(parsed.theme)
    ) {
      return { theme: parsed.theme, message: null }
    }
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'version' in parsed &&
      parsed.version === 1 &&
      'theme' in parsed &&
      parsed.theme === 'timberwolf'
    ) {
      const migrationMessage = saveThemePreference('system')
      return {
        theme: 'system',
        message: migrationMessage,
      }
    }
  } catch {
    return {
      theme: 'system',
      message: 'Saved theme preference could not be read. System appearance is active.',
    }
  }

  return {
    theme: 'system',
    message: 'Saved theme preference is invalid. System appearance is active.',
  }
}

export function saveThemePreference(theme: ThemePreference): string | null {
  try {
    window.localStorage.setItem(
      THEME_PREFERENCE_KEY,
      JSON.stringify({ version: 1, theme }),
    )
    return null
  } catch {
    return 'Could not save your theme preference in this browser.'
  }
}
