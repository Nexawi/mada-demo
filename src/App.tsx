import { useEffect, useState, type ReactNode } from "react";
import { useT, type Key } from "./i18n";
import { useDemo, type Scenario, type Tab } from "./store";
import { Button, Segmented, Sheet } from "./components/ui";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Toaster } from "sonner";
import { LiveEvents } from "./components/live";
import { Consent, PathChoice, Reading, RiskCheck, Welcome } from "./screens/Onboarding";
import { Activity, Home, Invest, Pots, Settings } from "./screens/Main";

const TABS: { id: Tab; icon: ReactNode }[] = [
  { id: "home", icon: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /> },
  { id: "pots", icon: <path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" /> },
  { id: "invest", icon: <path d="M4 19h16M6 16l4-5 3 3 5-7" /> },
  { id: "activity", icon: <path d="M5 6h14M5 12h14M5 18h9" /> },
  {
    id: "settings",
    icon: <path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM4 12h2m12 0h2M12 4v2m0 12v2" />,
  },
];

const fade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6, pointerEvents: "none" as const },
  transition: { duration: 0.18, ease: "easeOut" as const },
};

/** Advances the simulation on a timer; waits while an approval is pending. */
function useAutoplay(playing: boolean, speed: "normal" | "fast") {
  const stage = useDemo((s) => s.stage);
  const blocked = useDemo((s) => !!s.pendingRate || !!s.pendingBuy);
  const nextMonth = useDemo((s) => s.nextMonth);
  useEffect(() => {
    if (!playing || stage !== "app" || blocked) return;
    const id = window.setInterval(nextMonth, speed === "fast" ? 1100 : 2400);
    return () => window.clearInterval(id);
  }, [playing, speed, stage, blocked, nextMonth]);
  return blocked;
}

function AppScreens() {
  const { t } = useT();
  const stage = useDemo((s) => s.stage);
  const tab = useDemo((s) => s.tab);
  const set = useDemo((s) => s.set);
  if (stage !== "app") {
    const Step = {
      welcome: Welcome,
      consent: Consent,
      reading: Reading,
      risk: RiskCheck,
      path: PathChoice,
    }[stage];
    return (
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={stage} className="h-full" {...fade}>
          <Step />
        </motion.div>
      </AnimatePresence>
    );
  }
  const Screen = { home: Home, pots: Pots, invest: Invest, activity: Activity, settings: Settings }[
    tab
  ];
  return (
    <div className="flex h-full flex-col">
      <AnimatePresence mode="wait" initial={false}>
        <motion.main key={tab} className="flex-1 overflow-y-auto px-5 pt-6 pb-6" {...fade}>
          <Screen />
        </motion.main>
      </AnimatePresence>
      <nav
        aria-label="Main"
        className="grid grid-cols-5 border-t border-line bg-paper pb-[env(safe-area-inset-bottom)]"
      >
        {TABS.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => set({ tab: x.id })}
            aria-current={tab === x.id ? "page" : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${tab === x.id ? "text-brand" : "text-muted"}`}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {x.icon}
            </svg>
            {t(`tab.${x.id}` as Key)}
          </button>
        ))}
      </nav>
    </div>
  );
}

const SCENARIOS: Scenario[] = ["raise", "cut", "essentials", "spend", "dip", "prize"];

interface PlayProps {
  playing: boolean;
  setPlaying: (v: boolean) => void;
  speed: "normal" | "fast";
  setSpeed: (v: "normal" | "fast") => void;
  blocked: boolean;
}

function DemoPanel({ showTitle = true, play }: { showTitle?: boolean; play: PlayProps }) {
  const { t, m, mon } = useT();
  const s = useDemo();
  const inApp = s.stage === "app";
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        {showTitle ? <h2 className="text-lg font-bold">{t("demo.title")}</h2> : <span />}
        <Button variant="subtle" onClick={() => s.set({ lang: s.lang === "en" ? "ar" : "en" })}>
          {t("lang.other")}
        </Button>
      </div>
      {inApp && (
        <>
          <div className="rounded-2xl bg-paper p-4">
            <p className="text-sm text-muted">{t("demo.month")}</p>
            <p className="text-xl font-bold">{s.month === 0 ? "—" : mon(s.month - 1)}</p>
            <p className="mt-1 text-sm text-muted">
              {t("demo.salary", { s: m(s.salary), e: m(s.essentials), o: m(s.other) })}
            </p>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">{t("demo.queue")}</p>
            <div className="flex flex-wrap gap-2">
              {SCENARIOS.map((sc) => (
                <button
                  key={sc}
                  type="button"
                  aria-pressed={s.queue.includes(sc)}
                  onClick={() => s.toggleScenario(sc)}
                  className={`min-h-11 rounded-full border px-3 text-sm font-semibold ${s.queue.includes(sc) ? "border-accent bg-sand text-sand-ink" : "border-line bg-paper text-ink"}`}
                >
                  {t(`sc.${sc}` as Key)}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-paper p-4">
            <Button
              className="w-full"
              onClick={() => play.setPlaying(!play.playing)}
              aria-pressed={play.playing}
            >
              {play.playing ? t("demo.pause") : t("demo.play")}
            </Button>
            <p className="mt-3 mb-1 text-sm font-semibold">{t("demo.speed")}</p>
            <Segmented<"normal" | "fast">
              label={t("demo.speed")}
              value={play.speed}
              onChange={play.setSpeed}
              options={[
                { value: "normal", label: t("demo.normal") },
                { value: "fast", label: t("demo.fast") },
              ]}
            />
            {play.playing && play.blocked && (
              <p className="mt-2 text-sm font-medium text-sand-ink" role="status">
                {t("demo.waiting")}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={s.nextMonth}>
              {t("demo.next")}
            </Button>
            <Button variant="ghost" onClick={() => s.runMonths(6)}>
              {t("demo.six")}
            </Button>
          </div>
        </>
      )}
      <Button variant="danger" onClick={s.reset}>
        {t("demo.reset")}
      </Button>
      <p className="text-xs text-muted">{t("app.concept")}</p>
    </div>
  );
}

function useIsWide() {
  const q = "(min-width: 1024px)";
  const [wide, setWide] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setWide(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}

export default function App() {
  const { t, lang } = useT();
  const wide = useIsWide();
  const [demoOpen, setDemoOpen] = useState(false);
  const inApp = useDemo((s) => s.stage === "app");
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<"normal" | "fast">("normal");
  const blocked = useAutoplay(playing, speed);
  const play = { playing, setPlaying, speed, setSpeed, blocked };
  const live = (
    <>
      <LiveEvents />
      <Toaster
        position={wide ? "bottom-right" : "top-center"}
        dir={lang === "ar" ? "rtl" : "ltr"}
        duration={2600}
        visibleToasts={3}
        toastOptions={{
          style: { fontFamily: "inherit", borderColor: "#ddd4e7", color: "#202124" },
        }}
      />
    </>
  );

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.title = t("app.name");
  }, [lang, t]);

  if (wide) {
    return (
      <MotionConfig reducedMotion="user">
        {live}
        <div className="flex min-h-full items-center justify-center gap-12 p-6">
          <div className="relative h-[min(820px,calc(100vh-48px))] w-[390px] shrink-0 overflow-hidden rounded-[44px] border-[10px] border-brand-deep bg-pearl shadow-2xl">
            <AppScreens />
          </div>
          <aside className="w-[340px]">
            <p className="mb-1 text-sm font-semibold text-brand">{t("app.name")}</p>
            <DemoPanel play={play} />
          </aside>
        </div>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      {live}
      <div className="flex h-full flex-col pt-[env(safe-area-inset-top)]">
        <div className="min-h-0 flex-1">
          <AppScreens />
        </div>
        <button
          type="button"
          onClick={() => setDemoOpen(true)}
          className={`fixed end-4 z-40 ${inApp ? "bottom-[calc(4.5rem+env(safe-area-inset-bottom))]" : "bottom-[calc(6rem+env(safe-area-inset-bottom))]"} min-h-11 rounded-full bg-accent px-4 text-sm font-bold text-brand-deep shadow-lg`}
        >
          {t("demo.open")}
        </button>
        <Sheet open={demoOpen} onClose={() => setDemoOpen(false)} title={t("demo.title")}>
          <DemoPanel showTitle={false} play={play} />
          <Button className="mt-4 w-full" variant="subtle" onClick={() => setDemoOpen(false)}>
            {t("demo.close")}
          </Button>
        </Sheet>
      </div>
    </MotionConfig>
  );
}
