import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from './theme/ThemeProvider.jsx'
import { LanguageProvider } from './i18n/LanguageProvider.jsx'
import { StoreSettingsProvider } from './settings/StoreSettingsProvider.jsx'
import { LabelTemplateProvider } from './labels/LabelTemplateProvider.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <StoreSettingsProvider>
          <LabelTemplateProvider>
            <App />
          </LabelTemplateProvider>
        </StoreSettingsProvider>
      </ThemeProvider>
    </LanguageProvider>
  </StrictMode>,
)
