import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '@renderer/locales/en/common.json'
import es from '@renderer/locales/es/common.json'

void i18n.use(initReactI18next).init({
  resources: { en: { common: en }, es: { common: es } },
  lng: 'en',
  fallbackLng: 'en',
  ns: ['common'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  react: { useSuspense: false }
})

export default i18n
