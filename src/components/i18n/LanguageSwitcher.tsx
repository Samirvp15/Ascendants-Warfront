import { useTranslation } from "react-i18next";
import type { AppLanguage } from "../../i18n";
import { HeaderButton } from "../ui/HeaderButton";
import { cn } from "../../utils/cn";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = i18n.language.startsWith("es") ? "es" : "en";

  const setLanguage = (lang: AppLanguage) => {
    void i18n.changeLanguage(lang);
  };

  return (
    <div
      className="flex items-center gap-[0.2em]"
      role="group"
      aria-label={t("common.languageSwitch")}
    >
      <HeaderButton
        type="button"
        onClick={() => setLanguage("en")}
        className={cn(current === "en" && "ring-1 ring-amber-400/70")}
        aria-pressed={current === "en"}
      >
        {t("common.languageEn")}
      </HeaderButton>
      <HeaderButton
        type="button"
        onClick={() => setLanguage("es")}
        className={cn(current === "es" && "ring-1 ring-amber-400/70")}
        aria-pressed={current === "es"}
      >
        {t("common.languageEs")}
      </HeaderButton>
    </div>
  );
}
