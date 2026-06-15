import { useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import type { Step } from "react-joyride";

const MAX_DECK = 6;

export function useGameTourSteps(): Step[] {
  const { t } = useTranslation();

  return useMemo(
    () => [
      {
        target: ".game-shell",
        placement: "center" as const,
        title: t("tour.steps.welcome.title"),
        content: (
          <>
            <p>
              <Trans i18nKey="tour.steps.welcome.body1" components={[<strong key="0" />]} />
            </p>
            <p className="game-tour-tooltip__hint">{t("tour.steps.welcome.body2")}</p>
          </>
        ),
        hideOverlay: true,
        skipBeacon: true,
      },
      {
        target: ".frame-stat--player-nexus",
        placement: "bottom" as const,
        title: t("tour.steps.nexus.title"),
        content: (
          <>
            <p>
              <Trans i18nKey="tour.steps.nexus.body1" components={[<strong key="0" />]} />
            </p>
            <p className="game-tour-tooltip__hint">{t("tour.steps.nexus.body2")}</p>
          </>
        ),
        skipBeacon: true,
      },
      {
        target: ".enemy-strip-stats",
        placement: "bottom" as const,
        title: t("tour.steps.enemy.title"),
        content: (
          <>
            <p>
              <Trans
                i18nKey="tour.steps.enemy.body1"
                components={[<strong key="0" />, <strong key="1" />, <strong key="2" />]}
              />
            </p>
            <p className="game-tour-tooltip__hint">{t("tour.steps.enemy.body2")}</p>
          </>
        ),
        skipBeacon: true,
      },
      {
        target: '[data-tour="lanes"]',
        placement: "left" as const,
        offset: 18,
        width: 320,
        title: t("tour.steps.lanes.title"),
        content: (
          <>
            <p>
              <Trans i18nKey="tour.steps.lanes.body1" components={[<strong key="0" />]} />
            </p>
            <ul className="game-tour-tooltip__list">
              <li>{t("tour.steps.lanes.rule1")}</li>
              <li>{t("tour.steps.lanes.rule2")}</li>
              <li>{t("tour.steps.lanes.rule3")}</li>
            </ul>
          </>
        ),
        floatingOptions: {
          flipOptions: {
            fallbackPlacements: ["left", "right"],
            padding: 20,
          },
          shiftOptions: { padding: 16 },
        },
        skipBeacon: true,
      },
      {
        target: ".frame-stat--player-mana",
        placement: "top" as const,
        title: t("tour.steps.mana.title"),
        content: (
          <>
            <p>
              <Trans i18nKey="tour.steps.mana.body1" components={[<strong key="0" />]} />
            </p>
            <p className="game-tour-tooltip__hint">{t("tour.steps.mana.body2")}</p>
          </>
        ),
        skipBeacon: true,
      },
      {
        target: ".hand-deck-zone",
        placement: "top" as const,
        title: t("tour.steps.hand.title"),
        content: (
          <>
            <p>
              <Trans i18nKey="tour.steps.hand.body1" components={[<strong key="0" />]} />
            </p>
            <ul className="game-tour-tooltip__list">
              <li>{t("tour.steps.hand.rule1")}</li>
              <li>{t("tour.steps.hand.rule2")}</li>
              <li>{t("tour.steps.hand.rule3")}</li>
            </ul>
          </>
        ),
        skipBeacon: true,
      },
      {
        target: ".hand-strike-btn",
        placement: "left" as const,
        title: t("tour.steps.strike.title"),
        content: (
          <>
            <p>
              <Trans i18nKey="tour.steps.strike.body1" components={[<strong key="0" />]} />
            </p>
            <p className="game-tour-tooltip__hint">{t("tour.steps.strike.body2")}</p>
          </>
        ),
        skipBeacon: true,
      },
      {
        target: '[data-tour="gold"]',
        placement: "bottom" as const,
        title: t("tour.steps.gold.title"),
        content: (
          <>
            <p>
              <Trans i18nKey="tour.steps.gold.body1" components={[<strong key="0" />]} />
            </p>
            <p className="game-tour-tooltip__hint">{t("tour.steps.gold.body2")}</p>
          </>
        ),
        skipBeacon: true,
      },
      {
        target: ".main-deck-panel",
        placement: "left" as const,
        title: t("tour.steps.shop.title"),
        content: (
          <>
            <p>
              <Trans
                i18nKey="tour.steps.shop.body1"
                values={{ maxDeck: MAX_DECK }}
                components={[<strong key="0" />]}
              />
            </p>
            <ul className="game-tour-tooltip__list">
              <li>{t("tour.steps.shop.rule1")}</li>
              <li>{t("tour.steps.shop.rule2")}</li>
              <li>{t("tour.steps.shop.rule3")}</li>
            </ul>
          </>
        ),
        skipBeacon: true,
      },
      {
        target: '[data-tour="how-it-works"]',
        placement: "right" as const,
        title: t("tour.steps.reference.title"),
        content: (
          <p>
            <Trans i18nKey="tour.steps.reference.body1" components={[<strong key="0" />]} />
          </p>
        ),
        skipBeacon: true,
      },
      {
        target: ".game-shell",
        placement: "center" as const,
        title: t("tour.steps.ready.title"),
        content: (
          <>
            <p>
              <Trans i18nKey="tour.steps.ready.body1" components={[<strong key="0" />]} />
            </p>
            <p className="game-tour-tooltip__hint">{t("tour.steps.ready.body2")}</p>
          </>
        ),
        hideOverlay: true,
        skipBeacon: true,
      },
    ],
    [t]
  );
}
