export type ThemeName = 'aurora' | 'matrix' | 'minimal' | 'cyber' | 'plain' | 'plain-dark'
export const THEME_KEY = 'aura:theme'
export const DEFAULT_THEME: ThemeName = 'plain'
export const THEMES: ThemeName[] = ['aurora', 'matrix', 'minimal', 'cyber', 'plain', 'plain-dark']

export function isThemeName(value: string | null): value is ThemeName {
  return value === 'aurora' || value === 'matrix' || value === 'minimal' || value === 'cyber' || value === 'plain' || value === 'plain-dark'
}
