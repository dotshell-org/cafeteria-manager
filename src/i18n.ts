import i18n from 'i18next'
import HttpBackend from 'i18next-http-backend'
import { initReactI18next } from 'react-i18next'

void i18n
    .use(HttpBackend)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        debug: process.env.NODE_ENV === 'development',
        backend: {

            loadPath: './i18n-locales/{{lng}}/{{ns}}.json'
        },
        interpolation: {
            escapeValue: false,
        },

    })

export default i18n