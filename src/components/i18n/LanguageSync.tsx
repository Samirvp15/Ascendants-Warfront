import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export function LanguageSync() {
  const { i18n, t } = useTranslation();

  useEffect(() => {
    const lang = i18n.language.startsWith("es") ? "es" : "en";
    document.documentElement.lang = lang;
    document.title = t("meta.title");
  }, [i18n.language, t]);

  return null;
}
