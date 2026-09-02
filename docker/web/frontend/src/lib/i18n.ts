// Copyright 2026 SK Telecom Co., Ltd.
// SPDX-License-Identifier: Apache-2.0

// @no-unit-test: i18next bootstrap (side-effecting init + re-export); behavior covered by the Playwright i18n suite.
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import en from "../locales/en/common.json";
import ko from "../locales/ko/common.json";
import zhTW from "../locales/zh-TW/common.json";

// Keep <html lang> in sync for a11y / SEO. Registered BEFORE init: with inline
// resources the initial languageChanged fires synchronously inside init(), so a
// listener attached after it would miss the detected language and leave the
// static lang from index.html standing.
i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
});

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: en },
      ko: { common: ko },
      "zh-TW": { common: zhTW },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "ko", "zh-TW"],
    defaultNS: "common",
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "sbom.lang",
      caches: ["localStorage"],
      // Only Traditional Chinese ships, so every Chinese navigator variant
      // (zh, zh-Hant-TW, zh-HK, zh-CN, …) lands there rather than falling
      // through supportedLngs to English.
      convertDetectedLanguage: (lng) => (/^zh(-|$)/i.test(lng) ? "zh-TW" : lng),
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
