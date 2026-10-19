export type HsvColor = {
  hue: number
  saturation: number
  value: number
}

export const PRESET_COLORS = [
  { label: 'Yellow', hex: '#FFFF00' },
  { label: 'Orange', hex: '#FFA500' },
  { label: 'Green', hex: '#0DFF62' },
  { label: 'Light blue', hex: '#8CCAFF' },
  { label: 'Peach', hex: '#FFAF8C' },
  { label: 'Magenta', hex: '#FE98FF' },
  { label: 'Aqua', hex: '#8CFFF1' },
  { label: 'Lime', hex: '#B2FF80' },
]

export function hsvToHex({ hue, saturation, value }: HsvColor): string {
  const normalizedHue = ((hue % 360) + 360) % 360
  const s = Math.min(100, Math.max(0, saturation)) / 100
  const v = Math.min(100, Math.max(0, value)) / 100
  const chroma = v * s
  const secondary = chroma * (1 - Math.abs(((normalizedHue / 60) % 2) - 1))
  const offset = v - chroma
  const sector = Math.floor(normalizedHue / 60)
  const rgb =
    sector === 0 ? [chroma, secondary, 0] :
    sector === 1 ? [secondary, chroma, 0] :
    sector === 2 ? [0, chroma, secondary] :
    sector === 3 ? [0, secondary, chroma] :
    sector === 4 ? [secondary, 0, chroma] :
    [chroma, 0, secondary]

  return `#${rgb
    .map((channel) =>
      Math.round((channel + offset) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')
    .toUpperCase()}`
}

export function hexToHsv(hex: string): HsvColor {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!match) throw new Error(`Invalid six-digit hex color: ${hex}`)

  const value = match[1]
  const red = Number.parseInt(value.slice(0, 2), 16) / 255
  const green = Number.parseInt(value.slice(2, 4), 16) / 255
  const blue = Number.parseInt(value.slice(4, 6), 16) / 255
  const maximum = Math.max(red, green, blue)
  const minimum = Math.min(red, green, blue)
  const difference = maximum - minimum

  let hue = 0
  if (difference !== 0) {
    if (maximum === red) hue = 60 * (((green - blue) / difference) % 6)
    else if (maximum === green) hue = 60 * ((blue - red) / difference + 2)
    else hue = 60 * ((red - green) / difference + 4)
  }

  return {
    hue: (hue + 360) % 360,
    saturation: maximum === 0 ? 0 : (difference / maximum) * 100,
    value: maximum * 100,
  }
}
