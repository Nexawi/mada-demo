import { useEffect, useRef } from "react";
import NumberFlow from "@number-flow/react";
import { toast } from "sonner";
import { useT } from "../i18n";
import { useDemo } from "../store";
import { logText } from "../logText";

export const locale = (lang: string) => (lang === "ar" ? "ar-BH-u-nu-latn" : "en-BH");

/** Money that rolls to its new value. Whole dinars show no decimals; otherwise 3 (fils). */
export function Money({ value, className = "" }: { value: number; className?: string }) {
  const { lang } = useT();
  const whole = Math.abs(value - Math.round(value)) < 0.0005;
  return (
    <NumberFlow
      className={`tnum ${className}`}
      value={value}
      locales={locale(lang)}
      format={{ minimumFractionDigits: whole ? 0 : 3, maximumFractionDigits: whole ? 0 : 3 }}
      prefix={lang === "ar" ? undefined : "BD "}
      suffix={lang === "ar" ? " د.ب" : undefined}
    />
  );
}

export function Percent({ value, className = "" }: { value: number; className?: string }) {
  const { lang } = useT();
  return (
    <NumberFlow className={`tnum ${className}`} value={value} locales={locale(lang)} suffix="%" />
  );
}

const BRAND = "#522b79";
const INK = "#000000";

const TOASTED = new Set([
  "log.saved",
  "log.bought",
  "log.matured",
  "log.rate",
  "log.prizeWin",
  "log.goal",
  "log.withdraw",
  "log.family",
]);

/** Turns new log entries into toasts and fires confetti on milestones. */
export function LiveEvents() {
  const { t, m } = useT();
  const log = useDemo((s) => s.log);
  const seen = useRef<number | null>(null);
  useEffect(() => {
    const top = log[0]?.id ?? 0;
    if (seen.current === null) {
      seen.current = top; // don't replay history on page load
      return;
    }
    const fresh = log.filter((e) => e.id > (seen.current ?? 0));
    seen.current = top;
    if (fresh.length > 30) return; // bulk load (sample account): no toasts or confetti
    fresh
      .filter((e) => TOASTED.has(e.key))
      .slice(0, 3)
      .reverse()
      .forEach((e) => toast(logText(e, t, m)));
    if (fresh.some((e) => e.key === "log.goal" || e.key === "log.prizeWin")) {
      void import("canvas-confetti").then(({ default: confetti }) =>
        confetti({
          particleCount: 110,
          spread: 75,
          origin: { y: 0.35 },
          colors: [BRAND, INK, "#ffffff"],
          disableForReducedMotion: true,
        }),
      );
    }
  }, [log, t, m]);
  return null;
}
