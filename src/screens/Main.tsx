import { lazy, Suspense, useState } from "react";
import {
  BANK_SHARE,
  FAMILY_MEMBER_AMOUNT,
  NISAB_EXAMPLE,
  PERSONAS,
  netProfitOf,
  round3,
  zakatDue,
  type Path,
  type Risk,
  type Term,
} from "../engine";
import { useT, type Key } from "../i18n";
import { holdingsTotal, useDemo, usesTejoori, type PotKey } from "../store";
import { Button, Card, Notice, Progress, Segmented, Sheet, Switch } from "../components/ui";
import { AnimatePresence, motion } from "motion/react";
import { Money, Percent } from "../components/live";
import { logText } from "../logText";

const BalanceChart = lazy(() => import("../components/chart"));

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-bold text-muted">{title}</h2>
      {children}
    </section>
  );
}

const pop = {
  initial: { opacity: 0, y: -12, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.97 },
  transition: { type: "spring" as const, stiffness: 420, damping: 30 },
};

/** Goal name for display, falling back to "your goal". */
function useGoalLabel() {
  const { t } = useT();
  const name = useDemo((s) => s.goalName);
  return name || t("goal.default");
}

/** The engine's monthly recommendation and the goal-reached choice. */
export function PendingCards() {
  const { t, m } = useT();
  const s = useDemo();
  const goal = useGoalLabel();
  return (
    <AnimatePresence initial={false}>
      {s.pendingRate && (
        <motion.div key="rate" {...pop}>
          <Card className="mt-4 border-2 border-brand">
            <h2 className="text-lg font-bold">{t("pending.rate", { r: s.pendingRate.rate })}</h2>
            <p className="mt-1 text-sm text-muted">
              {t("pending.rate.d", { min: s.minRate, max: s.maxRate })}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={s.acceptRate}>
                {t("pending.accept", { r: s.pendingRate.rate })}
              </Button>
              <Button variant="ghost" onClick={s.keepRate}>
                {t("pending.keep", { r: s.rate })}
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
      {s.pendingGoal && (
        <motion.div key="goal" {...pop}>
          <Card className="mt-4 border-2 border-ink">
            <h2 className="text-lg font-bold">
              {t("goal.title", { name: goal, g: m(s.goalAmount) })}
            </h2>
            <p className="mt-1 text-sm text-muted">{t("goal.d")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => s.chooseAfterGoal("keep")}>{t("goal.keep")}</Button>
              <Button variant="dark" onClick={() => s.chooseAfterGoal("invest")}>
                {t("goal.invest")}
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Home() {
  const { t, m } = useT();
  const s = useDemo();
  const goal = useGoalLabel();
  const invested = round3(holdingsTotal(s.holdings) + s.investPot);
  const total = round3(s.tejoori + invested);
  const hasTejoori = usesTejoori(s);
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted">{t("home.greet", { name: t(`persona.${s.personaId}`) })}</p>
        {s.accountType === "family" && (
          <span className="rounded-md bg-ink px-2 py-0.5 text-xs font-semibold text-white">
            {t("family.badge")}
          </span>
        )}
      </div>
      <div className="mt-2 rounded-3xl bg-brand p-5 text-white">
        <p className="text-sm text-brand-soft">{t("home.total")}</p>
        <p className="mt-1 text-4xl font-extrabold">
          <Money value={total} />
        </p>
        <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/20 pt-3">
          <div>
            <p className="text-sm text-brand-soft">{t("home.rate")}</p>
            <p className="font-semibold">
              {t("home.rateAmt", { r: s.rate, a: m(round3((s.salary * s.rate) / 100)) })}
            </p>
            <p className="text-xs text-brand-soft">
              {t("home.limits", { min: s.minRate, max: s.maxRate })}
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-lg font-extrabold text-brand">
            <Percent value={s.rate} />
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {s.month === 0 && <Notice>{t("home.empty")}</Notice>}
        {s.paused && <Notice tone="warn">{t("home.paused")}</Notice>}
        {s.dip && <Notice tone="warn">{t("home.dip")}</Notice>}
      </div>

      <PendingCards />

      <div className="mt-4 grid grid-cols-2 gap-3">
        {hasTejoori && (
          <button
            type="button"
            onClick={() => s.set({ tab: "pots" })}
            className="rounded-2xl bg-paper p-4 text-start"
          >
            <p className="text-sm text-muted">{t("tejoori.name")}</p>
            <p className="mt-1 text-lg font-bold">
              <Money value={s.tejoori} />
            </p>
            <div className="mt-3">
              <Progress value={(s.tejoori / s.goalAmount) * 100} label={goal} />
            </div>
            <p className="tnum mt-1.5 truncate text-xs text-muted">
              {goal}:{" "}
              {t("home.goal", {
                p: Math.min(100, Math.round((s.tejoori / s.goalAmount) * 100)),
                g: m(s.goalAmount),
              })}
            </p>
          </button>
        )}
        <button
          type="button"
          onClick={() => s.set({ tab: "invest" })}
          className={`rounded-2xl bg-ink p-4 text-start text-white ${hasTejoori ? "" : "col-span-2"}`}
        >
          <p className="text-sm text-white/75">{t("home.invested")}</p>
          <p className="mt-1 text-lg font-bold">
            <Money value={invested} />
          </p>
          <p className="mt-3 text-xs text-white/75">{t("home.sukuk", { n: s.holdings.length })}</p>
        </button>
      </div>
      <Suspense fallback={<div className="mt-4 h-[212px] rounded-2xl bg-paper" />}>
        <BalanceChart />
      </Suspense>
    </div>
  );
}

export function Pots() {
  const { t, m } = useT();
  const s = useDemo();
  const goal = useGoalLabel();
  const [open, setOpen] = useState(false);
  const partner = PERSONAS.find((x) => x.id === s.personaId)!.partner;
  const hasTejoori = usesTejoori(s);
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">{t("tejoori.name")}</h1>
      {hasTejoori && (
        <Card className="mt-4">
          <p className="font-bold">{goal}</p>
          <p className="mt-1 text-3xl font-extrabold">
            <Money value={s.tejoori} />
          </p>
          <div className="mt-3">
            <Progress value={(s.tejoori / s.goalAmount) * 100} label={goal} />
          </div>
          <p className="tnum mt-1.5 text-sm text-muted">
            {t("home.goal", {
              p: Math.min(100, Math.round((s.tejoori / s.goalAmount) * 100)),
              g: m(s.goalAmount),
            })}
          </p>
          <p className="mt-3 text-sm text-muted">{t("tejoori.d")}</p>
        </Card>
      )}

      {s.accountType === "family" && (
        <Card className="mt-3">
          <p className="font-bold">{t("family.members")}</p>
          <ul className="mt-2 divide-y divide-line text-sm">
            <li className="flex justify-between gap-3 py-2">
              <span>
                {t(`persona.${s.personaId}`)} ({t("family.you")})
              </span>
              <span className="text-muted">
                {t("home.rateAmt", { r: s.rate, a: m(round3((s.salary * s.rate) / 100)) })}
              </span>
            </li>
            <li className="flex justify-between gap-3 py-2">
              <span>{t(`persona.${partner}`)}</span>
              <span className="text-muted">{t("family.adds", { a: m(FAMILY_MEMBER_AMOUNT) })}</span>
            </li>
          </ul>
          <p className="mt-2 text-xs text-muted">{t("family.note")}</p>
        </Card>
      )}

      {hasTejoori && (
        <Card className="mt-3">
          <div className="flex items-start justify-between gap-3">
            <p className="font-bold">{t("pots.prize")}</p>
            <span className="rounded-md bg-mist px-2 py-0.5 text-xs font-semibold text-ink">
              {t("pots.prize.ruling")}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">{t("pots.prize.d")}</p>
          <p className="tnum mt-2 font-semibold">
            {t("pots.prize.entries", { n: Math.floor(s.tejoori / 100) })}
          </p>
        </Card>
      )}

      <Card className="mt-3">
        <p className="font-bold">{t("pots.invest")}</p>
        <p className="mt-1 text-2xl font-extrabold">
          <Money value={s.investPot} />
        </p>
        <p className="mt-1 text-sm text-muted">{t("pots.invest.d")}</p>
        <p className="mt-3 text-sm font-semibold">{t("pots.liquid")}</p>
        <p className="text-sm text-muted">{t("pots.liquid.d", { p: s.liquidPct })}</p>
      </Card>

      <Button
        className="mt-4 w-full"
        variant="ghost"
        onClick={() => setOpen(true)}
        disabled={s.tejoori + s.investPot < 1}
      >
        {t("withdraw")}
      </Button>
      <WithdrawSheet open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function WithdrawSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, m } = useT();
  const s = useDemo();
  const [pot, setPot] = useState<PotKey>(usesTejoori(s) ? "tejoori" : "invest");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [cooling, setCooling] = useState(false);
  const [done, setDone] = useState("");
  const max = pot === "tejoori" ? s.tejoori : s.investPot;
  const close = () => {
    setAmount("");
    setError("");
    setCooling(false);
    setDone("");
    onClose();
  };
  const submit = (confirmed = false) => {
    const v = Number(amount);
    if (!Number.isFinite(v) || v < 1 || v > max) {
      setError(t("withdraw.err", { a: m(max) }));
      return;
    }
    if (pot === "invest" && s.dip && !confirmed) {
      setCooling(true);
      return;
    }
    s.withdraw(pot, v);
    setDone(t("withdraw.done", { a: m(v) }));
    setCooling(false);
    setAmount("");
  };
  return (
    <Sheet open={open} onClose={close} title={cooling ? t("cooling.title") : t("withdraw")}>
      {done ? (
        <>
          <Notice>{done}</Notice>
          <Button className="mt-4 w-full" onClick={close}>
            {t("demo.close")}
          </Button>
        </>
      ) : cooling ? (
        <>
          <p className="text-muted">{t("cooling.d")}</p>
          <div className="mt-4 flex gap-2">
            <Button className="flex-1" onClick={close}>
              {t("cooling.wait")}
            </Button>
            <Button variant="danger" onClick={() => submit(true)}>
              {t("cooling.confirm")}
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="mb-2 text-sm font-semibold">{t("withdraw.from")}</p>
          <Segmented<PotKey>
            label={t("withdraw.from")}
            value={pot}
            onChange={(v) => {
              setPot(v);
              setError("");
            }}
            options={[
              { value: "tejoori", label: t("tejoori.name") },
              { value: "invest", label: t("pots.invest") },
            ]}
          />
          <label htmlFor="amt" className="mt-4 block text-sm font-semibold">
            {t("withdraw.amount")}
          </label>
          <input
            id="amt"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value.replace(/[^\d.]/g, ""));
              setError("");
            }}
            aria-invalid={!!error}
            aria-describedby={error ? "amt-err" : undefined}
            className="tnum mt-1 block min-h-11 w-full rounded-lg border border-line bg-paper px-3 text-lg"
            placeholder={m(max)}
          />
          {error && (
            <p id="amt-err" className="mt-1 text-sm font-medium text-brand">
              {error}
            </p>
          )}
          <div className="mt-4 flex gap-2">
            <Button variant="ghost" onClick={close}>
              {t("cancel")}
            </Button>
            <Button className="flex-1" onClick={() => submit()}>
              {t("withdraw.go", { a: amount ? m(Number(amount) || 0) : "" })}
            </Button>
          </div>
        </>
      )}
    </Sheet>
  );
}

export function Invest() {
  const { t, m, mon } = useT();
  const s = useDemo();
  const wealth = round3(s.tejoori + s.investPot + holdingsTotal(s.holdings));
  const zakat = zakatDue(wealth);
  const share = Math.round(BANK_SHARE * 100);
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">{t("tab.invest")}</h1>

      <div className="mt-4 rounded-3xl bg-ink p-5 text-white">
        <p className="text-lg font-bold">{t("invest.reinvest.title")}</p>
        <p className="mt-1 text-sm text-white/80">{t("invest.reinvest.d")}</p>
        <p className="mt-4 text-sm text-white/70">{t("invest.reinvested")}</p>
        <p className="text-3xl font-extrabold">
          <Money value={s.reinvested} />
        </p>
      </div>

      <PendingCards />

      <Section title={t("invest.holdings")}>
        {s.holdings.length === 0 ? (
          <Card>
            <p className="text-muted">{t("invest.none")}</p>
          </Card>
        ) : (
          <ul className="grid gap-2">
            <AnimatePresence initial={false}>
              {s.holdings.map((h) => (
                <motion.li
                  key={h.id}
                  layout
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  className="rounded-2xl bg-paper p-4"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="tnum text-lg font-bold">{m(h.amount)}</span>
                    <span className="text-sm font-semibold text-brand">
                      {t(`term.${h.term}` as Key)} ·{" "}
                      {t("invest.rate", { r: (h.rate * 100).toFixed(1) })}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between gap-3 text-sm text-muted">
                    <span>{t("invest.matures", { m: mon(h.maturity) })}</span>
                    <span>{t("invest.profit", { p: m(netProfitOf(h)) })}</span>
                  </div>
                  <div className="mt-2">
                    <Progress
                      value={((s.month - h.start) / h.term) * 100}
                      label={t("invest.matures", { m: mon(h.maturity) })}
                    />
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
        <div className="mt-2 flex items-center justify-between rounded-2xl border border-dashed border-line p-4 text-muted">
          <span>
            <span className="block font-semibold">{t("invest.etf")}</span>
            <span className="text-sm">{t("invest.etf.d")}</span>
          </span>
          <span className="rounded-md bg-mist px-2 py-0.5 text-xs font-semibold">
            {t("invest.locked")}
          </span>
        </div>
      </Section>

      <Section title={t("fee.title")}>
        <Card>
          <p className="text-sm text-muted">{t("fee.d", { s: share })}</p>
          <p className="mt-3 text-sm font-semibold">{t("fee.paid")}</p>
          <p className="text-xl font-bold">
            <Money value={s.bankFees} />
          </p>
          <p className="mt-2 text-xs text-muted">{t("fee.example", { s: share })}</p>
        </Card>
      </Section>

      <Section title={t("islamic.title")}>
        <Card className="divide-y divide-line">
          <div className="pb-3">
            <p className="font-semibold">{t("zakat")}</p>
            {zakat > 0 ? (
              <>
                <p className="text-xl font-bold">
                  <Money value={zakat} />
                </p>
                <p className="text-sm text-muted">
                  {t("zakat.d", { w: m(wealth), n: m(NISAB_EXAMPLE) })}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">{t("zakat.none", { n: m(NISAB_EXAMPLE) })}</p>
            )}
          </div>
          <div className="py-3">
            <p className="font-semibold">{t("purify")}</p>
            <p className="text-sm text-muted">{t("purify.d")}</p>
          </div>
          <div className="pt-3">
            <p className="font-semibold">{t("cert")}</p>
            <p className="text-sm text-muted">{t("cert.d")}</p>
          </div>
        </Card>
      </Section>
      <p className="mt-4 text-xs text-muted">{t("invest.disclaimer")}</p>
    </div>
  );
}

export function Activity() {
  const { t, m, mon } = useT();
  const log = useDemo((s) => s.log);
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">{t("tab.activity")}</h1>
      {log.length === 0 ? (
        <p className="mt-4 text-muted">{t("activity.empty")}</p>
      ) : (
        <ol className="mt-4 grid gap-0">
          {log.map((e, i) => {
            const first = i === 0 || log[i - 1].month !== e.month;
            return (
              <li key={e.id ?? i}>
                {first && (
                  <p className="mt-4 mb-1 text-xs font-bold text-muted">{mon(e.month - 1)}</p>
                )}
                <p className="border-b border-line py-2.5 text-sm">{logText(e, t, m)}</p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export function Settings() {
  const { t } = useT();
  const s = useDemo();
  const [goal, setGoal] = useState(String(s.goalAmount));
  const paths: Path[] = ["tejoori", "split", "invest"];
  const risks: Risk[] = ["cautious", "balanced", "growth"];
  const saveGoal = (v: string) => {
    setGoal(v);
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) s.set({ goalAmount: n, goalReached: s.tejoori >= n });
  };
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">{t("tab.settings")}</h1>
      <Card className="mt-4">
        <Switch
          checked={s.paused}
          onChange={(paused) => s.set({ paused })}
          label={t("settings.pause")}
          hint={t("settings.pause.d")}
        />
      </Card>
      <Section title={t("settings.path")}>
        <Segmented<Path>
          label={t("settings.path")}
          value={s.path}
          onChange={(path) => s.set({ path })}
          options={paths.map((p) => ({ value: p, label: t(`path.${p}`) }))}
        />
        {s.path === "split" && (
          <Card className="mt-2">
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-brand">{t("split.save", { x: 100 - s.investPct })}</span>
              <span className="text-ink">{t("split.invest", { x: s.investPct })}</span>
            </div>
            <input
              aria-label={t("split.label")}
              type="range"
              min={10}
              max={90}
              step={10}
              value={s.investPct}
              onChange={(e) => s.set({ investPct: Number(e.target.value) })}
            />
          </Card>
        )}
        {s.path === "invest" && (
          <div className="mt-2">
            <Notice tone="warn">{t("path.warn")}</Notice>
          </div>
        )}
      </Section>
      {usesTejoori(s) && (
        <Section title={t("settings.goal")}>
          <Card className="grid gap-3">
            <label className="text-sm font-semibold">
              {t("tejoori.goalName")}
              <input
                className="mt-1 block min-h-11 w-full rounded-lg border border-line bg-paper px-3"
                value={s.goalName}
                maxLength={40}
                placeholder={t("tejoori.goalPh")}
                onChange={(e) => s.set({ goalName: e.target.value })}
              />
            </label>
            <label className="text-sm font-semibold">
              {t("tejoori.goalAmount")}
              <input
                className="tnum mt-1 block min-h-11 w-full rounded-lg border border-line bg-paper px-3"
                inputMode="decimal"
                value={goal}
                onChange={(e) => saveGoal(e.target.value.replace(/[^\d.]/g, ""))}
              />
            </label>
          </Card>
        </Section>
      )}
      <Section title={t("limits.title")}>
        <Card>
          <p className="tnum font-semibold">
            {s.minRate}% – {s.maxRate}%
          </p>
          <p className="text-sm text-muted">{t("limits.note")}</p>
        </Card>
      </Section>
      <Section title={t("settings.term")}>
        <Segmented<string>
          label={t("settings.term")}
          value={String(s.term)}
          onChange={(v) => s.set({ term: Number(v) as Term })}
          options={[3, 6, 12].map((v) => ({ value: String(v), label: t(`term.${v}` as Key) }))}
        />
      </Section>
      <Section title={t("settings.risk")}>
        <Segmented<Risk>
          label={t("settings.risk")}
          value={s.risk}
          onChange={(risk) => s.set({ risk })}
          options={risks.map((r) => ({ value: r, label: t(`risk.${r}`) }))}
        />
      </Section>
      <Section title={t("settings.liquid")}>
        <Card>
          <p className="font-semibold">{t("pots.liquid.d", { p: s.liquidPct })}</p>
          <input
            aria-label={t("settings.liquid")}
            type="range"
            min={0}
            max={30}
            step={5}
            value={s.liquidPct}
            onChange={(e) => s.set({ liquidPct: Number(e.target.value) })}
          />
        </Card>
      </Section>
      <Section title={t("settings.lang")}>
        <Button variant="subtle" onClick={() => s.set({ lang: s.lang === "en" ? "ar" : "en" })}>
          {t("lang.other")}
        </Button>
      </Section>
      <Button className="mt-8 w-full" variant="danger" onClick={s.reset}>
        {t("settings.reset")}
      </Button>
    </div>
  );
}
