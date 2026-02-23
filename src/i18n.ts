import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import id from "./locales/id.json";

// Get stored language preference or default to English
const getInitialLanguage = (): string => {
  const stored = localStorage.getItem("userLanguage");
  if (stored && (stored === "en" || stored === "id")) {
    return stored;
  }
  return "en"; // Default to English
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    id: { translation: id },
  },
  lng: getInitialLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

export default i18n;
