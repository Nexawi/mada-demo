import { useState } from "react";
import { NISAB_EXAMPLE, SUKUK_RATE, TARGET_MONTHS, PERSONAS, profitOf, zakatDue, round3, type Path, type Risk } from "../engine";
import { useT, type Key } from "../i18n";
import { holdingsTotal, targetOf, useDemo, type PotKey } from "../store";
import { Button, Card, Notice, Progress, Segmented, Sheet, Switch } from "../components/ui";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-bold text-muted">{title}</h2>
      {children}
    </section>
  );
}

export function PendingCards() {
  const { t, m, mon } = useT();
  const s = useDemo();
  return (
    <>
      {s.pendingRate && (
        <Card className="mt-4 border-2 border-gold">
          <h2 className="text-lg font-bold">{t("pending.rate", { r: s.pendingRate.rate })}</h2>
          <p className="mt-1 text-sm text-muted">{t(`reason.${s.pendingRate.reason}` as Key)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={s.acceptRate}>{t("pending.accept", { r: s.pendingRate.rate })}</Button>
            <Button variant="ghost" onClick={s.keepRate}>{t("pending.keep", { r: s.rate })}</Button>
          </div>
        </Card>
      )}
      {s.pendingBuy && (
        <Card className="mt-4 border-2 border-violet-ink/40">
          <h2 className="text-lg font-bold">
            {t("pending.buy", { a: m(s.pendingBuy.amount), term: t(`term.${s.pendingBuy.term}` as Key) })}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {t("pending.buy.d", {
              p: m(profitOf({ amount: s.pendingBuy.amount, rate: SUKUK_RATE[s.pendingBuy.term], term: s.pendingBuy.term })),
              m: mon(s.month + s.pendingBuy.term),
            })}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={s.approveBuy}>{t("pending.approve")}</Button>
            <Button variant="ghost" onClick={s.declineBuy}>{t("pending.decline")}</Button>
          </div>
        </Card>
      )}
    </>
  );
}

export function Home() {
  const { t, m } = useT();
  const s = useDemo();
  const target = targetOf(s);
  const invested = round3(holdingsTotal(s.holdings) + s.investPot);
  const total = round3(s.emergency + invested);
  return (
    <div>
      <p className="text-muted">{t("home.greet", { name: t(`persona.${s.personaId}`) })}</p>
      <div className="mt-2 rounded-3xl bg-deep p-5 text-white">
        <p className="text-sm text-[#CFE0DA]">{t("home.total")}</p>
        <p className="tnum mt-1 text-4xl font-extrabold">{m(total)}</p>
        <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/15 pt-3">
          <div>
            <p className="text-sm text-[#CFE0DA]">{t("home.rate")}</p>
            <p className="font-semibold">{t("home.rateAmt", { r: s.rate, a: m(round3((s.salary * s.rate) / 100)) })}</p>
          </div>
          <span className="tnum rounded-full bg-gold px-3 py-1 text-lg font-extrabold text-[#1B1405]">{s.rate}%</span>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {s.month === 0 && <Notice>{t("home.empty")}</Notice>}
        {s.paused && <Notice tone="warn">{t("home.paused")}</Notice>}
        {s.dip && <Notice tone="warn">{t("home.dip")}</Notice>}
        {s.notice === "held" && <Notice>{t("home.held", { r: s.rate })}</Notice>}
        {s.notice === "target" && <Notice>{t("home.target")}</Notice>}
      </div>

      <PendingCards />

      <div className="mt-4 grid grid-cols-2 gap-3">
        {s.path !== "direct" && (
          <button type="button" onClick={() => s.set({ tab: "pots" })} className="rounded-2xl bg-paper p-4 text-start">
            <p className="text-sm text-muted">{t("home.emergency")}</p>
            <p className="tnum mt-1 text-lg font-bold">{m(s.emergency)}</p>
            <div className="mt-3"><Progress value={(s.emergency / target) * 100} label={t("home.emergency")} /></div>
            <p className="tnum mt-1.5 text-xs text-muted">{t("home.ofTarget", { p: Math.min(100, Math.round((s.emergency / target) * 100)), t: m(target) })}</p>
          </button>
        )}
        <button type="button" onClick={() => s.set({ tab: "invest" })} className={`rounded-2xl bg-violet p-4 text-start ${s.path === "direct" ? "col-span-2" : ""}`}>
          <p className="text-sm text-violet-ink">{t("home.invested")}</p>
          <p className="tnum mt-1 text-lg font-bold text-violet-ink">{m(invested)}</p>
          <p className="mt-3 text-xs text-violet-ink">{t("home.sukuk", { n: s.holdings.length })}</p>
        </button>
      </div>
    </div>
  );
}

export function Pots() {
  const { t, m } = useT();
  const s = useDemo();
  const [open, setOpen] = useState(false);
  const p = PERSONAS.find((x) => x.id === s.personaId)!;
  const target = targetOf(s);
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-deep">{t("tab.pots")}</h1>
      <Card className="mt-4">
        <p className="font-bold">{t("home.emergency")}</p>
        <p className="tnum mt-1 text-3xl font-extrabold">{m(s.emergency)}</p>
        <div className="mt-3"><Progress value={(s.emergency / target) * 100} label={t("home.emergency")} /></div>
        <p className="tnum mt-1.5 text-sm text-muted">{t("home.ofTarget", { p: Math.min(100, Math.round((s.emergency / target) * 100)), t: m(target) })}</p>
        <p className="mt-3 text-sm text-muted">{t("pots.emergency.d", { m: TARGET_MONTHS[p.sector] })}</p>
      </Card>

      <Card className="mt-3">
        <div className="flex items-start justify-between gap-3">
          <p className="font-bold">{t("pots.prize")}</p>
          <span className="rounded-md bg-sand px-2 py-0.5 text-xs font-semibold text-sand-ink">{t("pots.prize.ruling")}</span>
        </div>
        <p className="mt-1 text-sm text-muted">{t("pots.prize.d")}</p>
        <p className="tnum mt-2 font-semibold">{t("pots.prize.entries", { n: Math.floor(s.emergency / 100) })}</p>
      </Card>

      <Card className="mt-3">
        <p className="font-bold">{t("pots.invest")}</p>
        <p className="tnum mt-1 text-2xl font-extrabold">{m(s.investPot)}</p>
        <p className="mt-1 text-sm text-muted">{t("pots.invest.d")}</p>
        <p className="mt-3 text-sm font-semibold">{t("pots.liquid")}</p>
        <p className="text-sm text-muted">{t("pots.liquid.d", { p: s.liquidPct })}</p>
      </Card>

      <Button className="mt-4 w-full" variant="ghost" onClick={() => setOpen(true)} disabled={s.emergency + s.investPot < 1}>
        {t("withdraw")}
      </Button>
      <WithdrawSheet open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function WithdrawSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, m } = useT();
  const s = useDemo();
  const [pot, setPot] = useState<PotKey>("emergency");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [cooling, setCooling] = useState(false);
  const [done, setDone] = useState("");
  const max = pot === "emergency" ? s.emergency : s.investPot;
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
          <Button className="mt-4 w-full" onClick={close}>{t("demo.close")}</Button>
        </>
      ) : cooling ? (
        <>
          <p className="text-muted">{t("cooling.d")}</p>
          <div className="mt-4 flex gap-2">
            <Button className="flex-1" onClick={close}>{t("cooling.wait")}</Button>
            <Button variant="danger" onClick={() => submit(true)}>{t("cooling.confirm")}</Button>
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
              { value: "emergency", label: t("home.emergency") },
              { value: "invest", label: t("pots.invest") },
            ]}
          />
          <label htmlFor="amt" className="mt-4 block text-sm font-semibold">{t("withdraw.amount")}</label>
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
          {error && <p id="amt-err" className="mt-1 text-sm font-medium text-sand-ink">{error}</p>}
          <div className="mt-4 flex gap-2">
            <Button variant="ghost" onClick={close}>{t("cancel")}</Button>
            <Button className="flex-1" onClick={() => submit()}>{t("withdraw.go", { a: amount ? m(Number(amount) || 0) : "" })}</Button>
          </div>
        </>
      )}
    </Sheet>
  );
}

export function Invest() {
  const { t, m, mon } = useT();
  const s = useDemo();
  const wealth = round3(s.emergency + s.investPot + holdingsTotal(s.holdings));
  const zakat = zakatDue(wealth);
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-deep">{t("tab.invest")}</h1>
      <PendingCards />
      <Section title={t("invest.holdings")}>
        {s.holdings.length === 0 ? (
          <Card><p className="text-muted">{t("invest.none")}</p></Card>
        ) : (
          <ul className="grid gap-2">
            {s.holdings.map((h) => (
              <li key={h.id} className="rounded-2xl bg-violet p-4 text-violet-ink">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="tnum text-lg font-bold">{m(h.amount)}</span>
                  <span className="text-sm font-semibold">{t(`term.${h.term}` as Key)} · {t("invest.rate", { r: (h.rate * 100).toFixed(1) })}</span>
                </div>
                <div className="mt-2 flex justify-between gap-3 text-sm">
                  <span>{t("invest.matures", { m: mon(h.maturity) })}</span>
                  <span>{t("invest.profit", { p: m(profitOf(h)) })}</span>
                </div>
                <div className="mt-2"><Progress value={((s.month - h.start) / h.term) * 100} label={t("invest.matures", { m: mon(h.maturity) })} /></div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2 flex items-center justify-between rounded-2xl border border-dashed border-line p-4 text-muted">
          <span>
            <span className="block font-semibold">{t("invest.etf")}</span>
            <span className="text-sm">{t("invest.etf.d")}</span>
          </span>
          <span className="rounded-md bg-mist px-2 py-0.5 text-xs font-semibold">{t("invest.locked")}</span>
        </div>
      </Section>

      <Section title={t("invest.mode")}>
        <Card>
          <Segmented<"auto" | "approve">
            label={t("invest.mode")}
            value={s.mode}
            onChange={(mode) => s.set({ mode })}
            options={[
              { value: "auto", label: t("mode.auto") },
              { value: "approve", label: t("mode.approve") },
            ]}
          />
          <p className="mt-2 text-sm text-muted">{t("invest.mode.d")}</p>
          <div className="mt-2 border-t border-line pt-2">
            <Switch checked={s.reinvest} onChange={(reinvest) => s.set({ reinvest })} label={t("invest.reinvest")} hint={t("invest.reinvest.d")} />
          </div>
        </Card>
      </Section>

      <Section title={t("islamic.title")}>
        <Card className="divide-y divide-line">
          <div className="pb-3">
            <p className="font-semibold">{t("zakat")}</p>
            {zakat > 0 ? (
              <>
                <p className="tnum text-xl font-bold">{m(zakat)}</p>
                <p className="text-sm text-muted">{t("zakat.d", { w: m(wealth), n: m(NISAB_EXAMPLE) })}</p>
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
      <h1 className="text-2xl font-extrabold text-deep">{t("tab.activity")}</h1>
      {log.length === 0 ? (
        <p className="mt-4 text-muted">{t("activity.empty")}</p>
      ) : (
        <ol className="mt-4 grid gap-0">
          {log.map((e, i) => {
            const p: Record<string, string | number> = {};
            for (const [k, v] of Object.entries(e.p ?? {})) {
              if (e.money?.includes(k)) p[k] = m(Number(v));
              else if (k === "term") p[k] = t(`term.${v}` as Key);
              else if (k === "pot") p[k] = t(v as Key);
              else p[k] = v;
            }
            const first = i === 0 || log[i - 1].month !== e.month;
            return (
              <li key={i}>
                {first && <p className="mt-4 mb-1 text-xs font-bold text-muted">{mon(e.month - 1)}</p>}
                <p className="border-b border-line py-2.5 text-sm">{t(e.key, p)}</p>
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
  const paths: Path[] = ["safety", "hybrid", "direct"];
  const risks: Risk[] = ["cautious", "balanced", "growth"];
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-deep">{t("tab.settings")}</h1>
      <Card className="mt-4">
        <Switch checked={s.paused} onChange={(paused) => s.set({ paused })} label={t("settings.pause")} hint={t("settings.pause.d")} />
      </Card>
      <Section title={t("settings.path")}>
        <Segmented<Path> label={t("settings.path")} value={s.path} onChange={(path) => s.set({ path })} options={paths.map((p) => ({ value: p, label: t(`path.${p}`) }))} />
        {s.path === "hybrid" && (
          <Card className="mt-2">
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-emerald">{t("split.save", { x: 100 - s.investPct })}</span>
              <span className="text-violet-ink">{t("split.invest", { x: s.investPct })}</span>
            </div>
            <input aria-label={t("split.label")} type="range" min={10} max={90} step={10} value={s.investPct} onChange={(e) => s.set({ investPct: Number(e.target.value) })} />
          </Card>
        )}
        {s.path === "direct" && <div className="mt-2"><Notice tone="warn">{t("path.warn")}</Notice></div>}
      </Section>
      <Section title={t("settings.risk")}>
        <Segmented<Risk> label={t("settings.risk")} value={s.risk} onChange={(risk) => s.set({ risk })} options={risks.map((r) => ({ value: r, label: t(`risk.${r}`) }))} />
      </Section>
      <Section title={t("limits.title")}>
        <Card>
          <p className="tnum font-semibold">{s.minRate}% – {s.maxRate}%</p>
          <p className="text-sm text-muted">{t("limits.note")}</p>
        </Card>
      </Section>
      <Section title={t("settings.liquid")}>
        <Card>
          <p className="font-semibold">{t("pots.liquid.d", { p: s.liquidPct })}</p>
          <input aria-label={t("settings.liquid")} type="range" min={0} max={30} step={5} value={s.liquidPct} onChange={(e) => s.set({ liquidPct: Number(e.target.value) })} />
        </Card>
      </Section>
      <Section title={t("settings.lang")}>
        <Button variant="subtle" onClick={() => s.set({ lang: s.lang === "en" ? "ar" : "en" })}>{t("lang.other")}</Button>
      </Section>
      <Button className="mt-8 w-full" variant="danger" onClick={s.reset}>{t("settings.reset")}</Button>
    </div>
  );
}
