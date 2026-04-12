import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../i18n/en.json'
import hi from '../i18n/hi.json'
import mr from '../i18n/mr.json'
import ta from '../i18n/ta.json'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    mr: { translation: mr },
    ta: { translation: ta },
  },
  lng: localStorage.getItem('lang') || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
