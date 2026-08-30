import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import pt from "./locales/pt/translation.json";
import en from "./locales/en/translation.json";
import es from "./locales/es/translation.json";
import fr from "./locales/fr/translation.json";
import de from "./locales/de/translation.json";
import it from "./locales/it/translation.json";
import zh from "./locales/zh/translation.json";
import ja from "./locales/ja/translation.json";
import ru from "./locales/ru/translation.json";
import ar from "./locales/ar/translation.json";
import hi from "./locales/hi/translation.json";
import ko from "./locales/ko/translation.json";
import nl from "./locales/nl/translation.json";
import tr from "./locales/tr/translation.json";
import pl from "./locales/pl/translation.json";
import lt from "./locales/lt/translation.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: {
        translation: pt
      },
      en: {
        translation: en
      },
      es: {
        translation: es
      },
      fr: {
        translation: fr
      },
      de: {
        translation: de
      },
      it: {
        translation: it
      },
      zh: {
        translation: zh
      },
      ja: {
        translation: ja
      },
      ru: {
        translation: ru
      },
      ar: {
        translation: ar
      },
      hi: {
        translation: hi
      },
      ko: {
        translation: ko
      },
      nl: {
        translation: nl
      },
      tr: {
        translation: tr
      },
      pl: {
        translation: pl
      },
      lt: {
        translation: lt
      }
    },

    fallbackLng: "pt",

    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
