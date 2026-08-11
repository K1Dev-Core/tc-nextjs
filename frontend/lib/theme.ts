export type ThemeName = 'aurora' | 'matrix' | 'minimal' | 'cyber' | 'plain'
export const THEME_KEY = 'aura:theme'
export const DEFAULT_THEME: ThemeName = 'aurora'
export const THEMES: ThemeName[] = ['aurora', 'matrix', 'minimal', 'cyber', 'plain']

export function isThemeName(value: string | null): value is ThemeName {
  return value === 'aurora' || value === 'matrix' || value === 'minimal' || value === 'cyber' || value === 'plain'
}
