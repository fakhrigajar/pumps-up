import { createContext, useContext } from 'react'

export const LanguageContext = createContext(null)

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useTranslation must be used inside a LanguageProvider')
  return context
}

export const LANGUAGES = [
  { id: 'en', name: 'English', short: 'EN', locale: 'en-US' },
  { id: 'ru', name: 'Русский', short: 'RU', locale: 'ru-RU' },
  { id: 'az', name: 'Azərbaycanca', short: 'AZ', locale: 'az-AZ' },
]

export const DEFAULT_LANGUAGE = 'en'

export function localeOf(language) {
  return LANGUAGES.find((item) => item.id === language)?.locale ?? 'en-US'
}
