import i18n from 'i18next';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

(window as any).ipcRenderer.invoke('getLanguagePreference')
    .then((preference: string | null) => {
        const savedLanguage = preference ?? 'en';

        void i18n
            .use(HttpBackend)
            .use(initReactI18next)
            .init({
                lng: savedLanguage,
                fallbackLng: 'en',
                debug: process.env.NODE_ENV === 'development',
                backend: {
                    loadPath: './i18n-locales/{{lng}}/{{ns}}.json'
                },
                interpolation: {
                    escapeValue: false,
                },
            });
    })
    .catch(() => {
        const savedLanguage = 'en';

        void i18n
            .use(HttpBackend)
            .use(initReactI18next)
            .init({
                lng: savedLanguage,
                fallbackLng: 'en',
                debug: process.env.NODE_ENV === 'development',
                backend: {
                    loadPath: './i18n-locales/{{lng}}/{{ns}}.json'
                },
                interpolation: {
                    escapeValue: false,
                },
            });
    });

export default i18n;
