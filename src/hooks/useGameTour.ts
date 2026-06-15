import { useCallback, useEffect, useMemo, useState } from "react";
import { EVENTS, useJoyride, type EventData } from "react-joyride";
import { useTranslation } from "react-i18next";
import { GameTourTooltip } from "../components/tour/GameTourTooltip";
import { useGameTourSteps } from "./useGameTourSteps";

export const GAME_TOUR_STORAGE_KEY = "ascendants-warfront-tour-v1";

export function useGameTour() {
  const { t } = useTranslation();
  const [run, setRun] = useState(false);
  const steps = useGameTourSteps();

  const finishTour = useCallback(() => {
    setRun(false);
    localStorage.setItem(GAME_TOUR_STORAGE_KEY, "1");
  }, []);

  const handleEvent = useCallback(
    (data: EventData) => {
      if (data.type === EVENTS.TOUR_END) {
        finishTour();
      }
    },
    [finishTour]
  );

  const locale = useMemo(
    () => ({
      back: t("tour.localeBack"),
      close: t("tour.localeClose"),
      last: t("tour.localeLast"),
      next: t("tour.localeNext"),
      nextWithProgress: t("tour.localeNextProgress"),
      open: t("tour.localeOpen"),
      skip: t("tour.localeSkip"),
    }),
    [t]
  );

  const options = useMemo(
    () => ({
      zIndex: 10050,
      overlayColor: "rgba(4, 4, 10, 0.84)",
      primaryColor: "#8b6914",
      textColor: "#f1f5f9",
      backgroundColor: "#2a2520",
      arrowColor: "#c4a035",
      spotlightPadding: 10,
      spotlightRadius: 12,
      width: 380,
      skipScroll: true,
      showProgress: false,
    }),
    []
  );

  const floatingOptions = useMemo(
    () => ({
      flipOptions: { padding: 20 },
      shiftOptions: { padding: 16 },
    }),
    []
  );

  const { Tour, controls } = useJoyride({
    steps,
    run,
    continuous: true,
    scrollToFirstStep: false,
    tooltipComponent: GameTourTooltip,
    locale,
    options,
    floatingOptions,
    onEvent: handleEvent,
  });

  const startTour = useCallback(() => {
    setRun(false);
    controls.reset(true);
    window.requestAnimationFrame(() => setRun(true));
  }, [controls]);

  useEffect(() => {
    if (!run) return;

    const html = document.documentElement;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    html.style.overflow = "visible";
    document.body.style.overflow = "visible";

    return () => {
      html.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [run]);

  useEffect(() => {
    if (localStorage.getItem(GAME_TOUR_STORAGE_KEY)) return;

    const timer = window.setTimeout(() => setRun(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  return { Tour, startTour };
}
