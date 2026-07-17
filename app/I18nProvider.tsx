"use client";

import { createContext, useContext } from "react";
import {
  dictionaryFor,
  type Dictionary,
  type Locale,
} from "../lib/i18n";

const I18nContext = createContext<{ locale: Locale; t: Dictionary }>({
  locale: "zh-CN",
  t: dictionaryFor("zh-CN"),
});

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ locale, t: dictionaryFor(locale) }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
