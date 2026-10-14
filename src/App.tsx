import { useEffect, useState, type ReactNode } from "react";
import { useT, type Key } from "./i18n";
import { useDemo, type Scenario, type Tab } from "./store";
import { Button, Segmented, Sheet } from "./components/ui";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Toaster } from "sonner";
import { LiveEvents } from "./components/live";
import { Logo } from "./components/Logo";
import { Consent, Plan, Reading, RiskCheck, TejooriSetup, Welcome } from "./screens/Onboarding";
import { Activity, Home, Invest, Pots, Settings } from "./screens/Main";

/** Filled icons for the side tabs; the centre Invest tab uses a stroked growth arrow. */
const TABS: { id: Tab; icon: ReactNode }[] = [
  { id: "home", icon: <path d="M12 3 3 10.5V21h6v-6h6v6h6V10.5z" /> },
  {
    id: "pots",
    icon: (
      <path
        fillRule="evenodd"
        d="M4 4h16a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-1v1.5h-3V19H8v1.5H5V19H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm8 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"
      />
    ),
  },
  { id: "invest", icon: <path d="M4 17l6-6 4 4 6-7M15 8h5v5" /> },
  { id: "activity", icon: <path d="M4 5h16v3H4zM4 10.5h16v3H4zM4 16h10v3H4z" /> },
  {
    id: "settings",
    icon: <path d="M4 7h9v2H4zM17 7h3v2h-3zM13 5h4v6h-4zM4 15h3v2H4zM11 15h9v2h-9zM7 13h4v6H7z" />,
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
  const blocked = useDemo((s) => !!s.pendingRate || s.pendingGoal);
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
      plan: Plan,
      tejoori: TejooriSetup,
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
      <header className="flex items-center justify-between px-5 pt-26">
        <Logo tagline={false} className="h-9 w-auto" />
      </header>
      <AnimatePresence mode="wait" initial={false}>
        <motion.main key={tab} className="flex-1 overflow-y-auto px-5 pt-3 pb-6" {...fade}>
          <Screen />
        </motion.main>
      </AnimatePresence>
      <nav
        aria-label="Main"
        className="relative bg-paper pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_0_#ddd2e8]"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 120 18"
          className="pointer-events-none absolute -top-[17px] left-1/2 h-[18px] w-[120px] -translate-x-1/2 drop-shadow-[0_-1px_0_#ddd2e8]"
        >
          <path d="M0 18C28 18 34 0 60 0s32 18 60 18z" fill="#ffffff" />
        </svg>
        <div className="relative grid grid-cols-5">
          {TABS.map((x) => {
            const active = tab === x.id;
            if (x.id === "invest")
              return (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => set({ tab: x.id })}
                  aria-current={active ? "page" : undefined}
                  className="flex min-h-16 flex-col items-center justify-end gap-1 pb-2 text-[11px] font-semibold text-ink"
                >
                  <span
                    className={`-mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white shadow-lg transition-shadow ${active ? "ring-4 ring-brand/35" : ""}`}
                  >
                    <svg
                      width="26"
                      height="26"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      {x.icon}
                    </svg>
                  </span>
                  <span className={active ? "font-bold" : ""}>{t(`tab.${x.id}` as Key)}</span>
                </button>
              );
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => set({ tab: x.id })}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-16 flex-col items-center justify-center gap-1 pt-1.5 text-[11px] ${active ? "font-bold text-ink" : "font-medium text-muted"}`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute top-0 h-1 w-9 rounded-full bg-brand transition-opacity ${active ? "opacity-100" : "opacity-0"}`}
                />
                <svg
                  width="23"
                  height="23"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  className={active ? "text-brand" : "text-ink"}
                >
                  {x.icon}
                </svg>
                {t(`tab.${x.id}` as Key)}
              </button>
            );
          })}
        </div>
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
                  className={`min-h-11 rounded-full border px-3 text-sm font-semibold ${s.queue.includes(sc) ? "border-brand bg-mist text-brand" : "border-line bg-paper text-ink"}`}
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
              <p className="mt-2 text-sm font-medium text-brand" role="status">
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
          style: { fontFamily: "inherit", borderColor: "#ddd2e8", color: "#000000" },
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
          
<div className="relative h-[min(820px,calc(100vh-48px))] w-[390px] shrink-0 overflow-visible rounded-[54px] bg-[#171719] p-[5px] shadow-[0_0_0_1px_#777,0_0_0_3px_#29292c,0_24px_70px_rgba(0,0,0,0.35)]">

  {/* Inner screen */}
  <div className="relative h-full w-full overflow-hidden rounded-[49px] bg-pearl">

    {/* Dynamic Island */}
    <div className="pointer-events-none absolute left-1/2 top-[12px] z-50 flex h-[30px] w-[104px] -translate-x-1/2 items-center justify-center rounded-full bg-black">
      <div className="absolute right-[17px] h-[8px] w-[8px] rounded-full bg-[#151515]" />
    </div>

    {/* Existing Mada application */}
    <AppScreens />

  </div>

  {/* Volume buttons */}
  <div className="pointer-events-none absolute -left-[7px] top-[125px] h-[36px] w-[4px] rounded-l-md bg-[#77777b]" />
  <div className="pointer-events-none absolute -left-[7px] top-[174px] h-[58px] w-[4px] rounded-l-md bg-[#77777b]" />
  <div className="pointer-events-none absolute -left-[7px] top-[242px] h-[58px] w-[4px] rounded-l-md bg-[#77777b]" />

  {/* Power button */}
  <div className="pointer-events-none absolute -right-[7px] top-[185px] h-[76px] w-[4px] rounded-r-md bg-[#77777b]" />

</div>

          <aside className="w-[340px]">
            <Logo className="mb-4 h-auto w-48" />
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
          className="fixed end-4 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-40 min-h-11 rounded-full bg-ink px-4 text-sm font-bold text-white shadow-lg"
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
