const i18next = require('i18next');
const { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } = process.env;

const setupI18n = () => {
  i18next.init({
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES.split(','),
    resources: {
      en: {
        translation: require('../locales/en.json')
      },
      es: {
        translation: require('../locales/es.json')
      },
      fr: {
        translation: require('../locales/fr.json')
      }
    },
    interpolation: {
      escapeValue: false
    }
  });
};

module.exports = {
  setupI18n
}; 