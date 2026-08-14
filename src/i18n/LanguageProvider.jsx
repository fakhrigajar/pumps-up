import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEFAULT_LANGUAGE, LANGUAGES, LanguageContext, localeOf } from './context'
import { dictionaries, en } from './translations'
import { setFormatLocale } from '../lib/format'
import { azFormats } from './azFormats'

const STORAGE_KEY = 'pumpsup.language'

function readStored() {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return LANGUAGES.some((item) => item.id === value) ? value : DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(readStored)
  const locale = localeOf(language)

  setFormatLocale(locale, language === 'az' ? azFormats : null)

  useEffect(() => {
    document.documentElement.lang = language
    try {
      localStorage.setItem(STORAGE_KEY, language)
    } catch {
    }
  }, [language])

  const t = useCallback(
    (key, vars) => {
      const dict = dictionaries[language] ?? en
      let template

      if (vars && typeof vars.count === 'number') {
        const category = new Intl.PluralRules(locale).select(vars.count)
        template = dict[`${key}_${category}`] ?? dict[`${key}_other`]
        if (template === undefined) {
          template = en[`${key}_${category}`] ?? en[`${key}_other`]
        }
      }

      template = template ?? dict[key] ?? en[key] ?? key

      if (!vars) return template
      return template.replace(/\{(\w+)\}/g, (match, name) =>
        vars[name] === undefined ? match : String(vars[name]),
      )
    },
    [language, locale],
  )

  const value = useMemo(
    () => ({ language, locale, setLanguage, t }),
    [language, locale, t],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
