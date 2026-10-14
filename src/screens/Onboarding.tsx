import { useState, type ReactNode } from "react";
import { PERSONAS, TARGET_MONTHS, emergencyTarget, initialRate, monthsToTarget, round3, type Path, type Risk } from "../engine";
import { useT, type Key } from "../i18n";
import { useDemo } from "../store";
import { Button, Card, Notice, Segmented } from "../components/ui";

function Frame({ step, children, footer }: { step?: number; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-4">
        {step !== undefined && (
          <div className="mb-5 flex gap-1.5" aria-hidden="true">
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-brand" : "bg-line"}`} />
            ))}
          </div>
        )}
        {children}
      </div>
      <div className="border-t border-line bg-pearl px-5 py-4">{footer}</div>
    </div>
  );
}

export function Welcome() {
  const { t, m } = useT();
  const start = useDemo((s) => s.start);
  const [pick, setPick] = useState<"ahmed" | "fatima">("ahmed");
  return (
    <Frame footer={<Button className="w-full" onClick={() => start(pick)}>{t("welcome.start", { name: t(`persona.${pick}`) })}</Button>}>
      <p className="text-sm font-semibold text-brand">{t("app.name")}</p>
      <h1 className="mt-3 text-[2rem] leading-[1.1] font-extrabold text-brand-deep">{t("welcome.title")}</h1>
      <p className="mt-4 text-muted">{t("welcome.body")}</p>
      <h2 className="mt-8 mb-3 font-bold">{t("welcome.pick")}</h2>
      <div role="radiogroup" aria-label={t("welcome.pick")} className="grid gap-2">
        {PERSONAS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={pick === p.id}
            onClick={() => setPick(p.id)}
            className={`rounded-2xl border-2 bg-paper p-4 text-start ${pick === p.id ? "border-brand" : "border-transparent"}`}
          >
            <span className="block text-lg font-bold">{t(`persona.${p.id}`)}</span>
            <span className="block text-sm text-muted">
              {t(`sector.${p.sector}`)} · {t("persona.salary", { x: m(p.salary) })}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-6 text-xs text-muted">{t("app.concept")}</p>
    </Frame>
  );
}

export function Consent() {
  const { t } = useT();
  const set = useDemo((s) => s.set);
  return (
    <Frame
      step={1}
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => set({ stage: "welcome" })}>{t("back")}</Button>
          <Button className="flex-1" onClick={() => set({ stage: "reading" })}>{t("consent.approve")}</Button>
        </div>
      }
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-deep text-white" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h16M6 10v8M10 10v8M14 10v8M18 10v8M3 20h18M12 3l9 5H3z" /></svg>
      </div>
      <h1 className="text-2xl font-extrabold text-brand-deep">{t("consent.title")}</h1>
      <p className="mt-3 text-muted">{t("consent.body")}</p>
      <Card className="mt-5 grid gap-3">
        {(["consent.read", "consent.pay"] as Key[]).map((k) => (
          <div key={k} className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mist text-brand" aria-hidden="true">✓</span>
            <span className="font-medium">{t(k)}</span>
          </div>
        ))}
      </Card>
      <p className="mt-4 text-sm text-muted">{t("consent.note")}</p>
    </Frame>
  );
}

export function Reading() {
  const { t, m } = useT();
  const s = useDemo();
  const p = PERSONAS.find((x) => x.id === s.personaId)!;
  const rate = initialRate(p, s.minRate, s.maxRate);
  const rows: [Key, string][] = [
    ["reading.salary", m(p.salary)],
    ["reading.essentials", m(p.essentials)],
    ["reading.other", m(p.other)],
    ["reading.employer", t(`sector.${p.sector}`)],
  ];
  return (
    <Frame
      step={2}
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => s.set({ stage: "consent" })}>{t("back")}</Button>
          <Button className="flex-1" onClick={() => s.set({ stage: "risk" })}>{t("next")}</Button>
        </div>
      }
    >
      <h1 className="text-2xl font-extrabold text-brand-deep">{t("reading.title")}</h1>
      <Card className="mt-5">
        <dl className="divide-y divide-line">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2.5">
              <dt className="text-muted">{t(k)}</dt>
              <dd className="tnum font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <div className="mt-4 rounded-2xl bg-brand-deep p-4 text-white">
        <p className="font-semibold">{t("reading.rate", { r: rate, a: m(round3((p.salary * rate) / 100)) })}</p>
      </div>
    </Frame>
  );
}

const RISKS: Risk[] = ["cautious", "balanced", "growth"];

export function RiskCheck() {
  const { t } = useT();
  const set = useDemo((s) => s.set);
  const [ans, setAns] = useState<number[]>([1, 1, 1]);
  const score = ans.reduce((a, b) => a + b, 0);
  const risk: Risk = RISKS[score <= 2 ? 0 : score <= 4 ? 1 : 2];
  return (
    <Frame
      step={3}
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => set({ stage: "reading" })}>{t("back")}</Button>
          <Button className="flex-1" onClick={() => set({ risk, stage: "path" })}>{t("next")}</Button>
        </div>
      }
    >
      <h1 className="text-2xl font-extrabold text-brand-deep">{t("risk.title")}</h1>
      {[1, 2, 3].map((q, qi) => (
        <fieldset key={q} className="mt-5">
          <legend className="mb-2 font-semibold">{t(`risk.q${q}` as Key)}</legend>
          <Segmented
            label={t(`risk.q${q}` as Key)}
            value={String(ans[qi])}
            options={[0, 1, 2].map((v) => ({ value: String(v), label: t(`risk.q${q}.${v}` as Key) }))}
            onChange={(v) => setAns((a) => a.map((x, i) => (i === qi ? Number(v) : x)))}
          />
        </fieldset>
      ))}
      <div className="mt-6">
        <Notice>{t("risk.result", { r: t(`risk.${risk}`) })}</Notice>
      </div>
    </Frame>
  );
}

export function PathChoice() {
  const { t, m } = useT();
  const s = useDemo();
  const p = PERSONAS.find((x) => x.id === s.personaId)!;
  const rate = initialRate(p, s.minRate, s.maxRate);
  const monthly = round3((p.salary * rate) / 100);
  const target = emergencyTarget(p);
  const toEmergency = s.path === "safety" ? monthly : s.path === "hybrid" ? (monthly * (100 - s.investPct)) / 100 : 0;
  const paths: Path[] = ["safety", "hybrid", "direct"];
  return (
    <Frame
      step={4}
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => s.set({ stage: "risk" })}>{t("back")}</Button>
          <Button className="flex-1" onClick={s.finishOnboarding}>{t("path.finish")}</Button>
        </div>
      }
    >
      <h1 className="text-2xl font-extrabold text-brand-deep">{t("path.title")}</h1>
      <div role="radiogroup" aria-label={t("path.title")} className="mt-5 grid gap-2">
        {paths.map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={s.path === k}
            onClick={() => s.set({ path: k })}
            className={`rounded-2xl border-2 bg-paper p-4 text-start ${s.path === k ? "border-brand" : "border-transparent"}`}
          >
            <span className="block font-bold">{t(`path.${k}`)}</span>
            <span className="block text-sm text-muted">{t(`path.${k}.d`)}</span>
          </button>
        ))}
      </div>

      {s.path === "hybrid" && (
        <Card className="mt-4">
          <label htmlFor="split" className="font-semibold">{t("split.label")}</label>
          <div className="mt-1 flex justify-between text-sm font-semibold">
            <span className="text-brand">{t("split.save", { x: 100 - s.investPct })}</span>
            <span className="text-invest-ink">{t("split.invest", { x: s.investPct })}</span>
          </div>
          <input id="split" type="range" min={10} max={90} step={10} value={s.investPct} onChange={(e) => s.set({ investPct: Number(e.target.value) })} />
        </Card>
      )}

      {s.path === "direct" ? (
        <div className="mt-4"><Notice tone="warn">{t("path.warn")}</Notice></div>
      ) : (
        <p className="mt-4 text-sm text-muted">
          {t("path.target", { t: m(target), m: TARGET_MONTHS[p.sector], a: m(round3(toEmergency)), n: monthsToTarget(target, toEmergency) })}
        </p>
      )}

      <Card className="mt-4">
        <h2 className="font-bold">{t("limits.title")}</h2>
        <p className="text-sm text-muted">{t("limits.note")}</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {(["minRate", "maxRate"] as const).map((k) => (
            <label key={k} className="text-sm font-semibold">
              {t(k === "minRate" ? "limits.min" : "limits.max")}
              <select
                className="mt-1 block min-h-11 w-full rounded-lg border border-line bg-paper px-2"
                value={s[k]}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  s.set(k === "minRate" ? { minRate: Math.min(v, s.maxRate) } : { maxRate: Math.max(v, s.minRate) });
                }}
              >
                {[5, 10, 15, 20, 25, 30].map((v) => (
                  <option key={v} value={v}>{v}%</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </Card>
    </Frame>
  );
}
