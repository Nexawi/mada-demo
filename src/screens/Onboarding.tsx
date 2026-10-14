import { useState, type ReactNode } from "react";
import {
  FAMILY_MEMBER_AMOUNT,
  PERSONAS,
  SAMPLE_SPENDING,
  TEJOORI_MIN,
  TERM_FOR_RISK,
  monthsToGoal,
  recommendRate,
  round3,
  type Path,
  type Risk,
  type Term,
} from "../engine";
import { useT, type Key } from "../i18n";
import { useDemo, usesTejoori } from "../store";
import { Button, Card, Notice, Segmented } from "../components/ui";
import { Logo } from "../components/Logo";

function Frame({
  step,
  steps = 5,
  children,
  footer,
}: {
  step?: number;
  steps?: number;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-4">
        {step !== undefined && (
          <div className="mb-5 flex gap-1.5" aria-hidden="true">
            {Array.from({ length: steps }, (_, i) => i + 1).map((i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full ${i <= step ? "bg-brand" : "bg-line"}`}
              />
            ))}
          </div>
        )}
        {children}
      </div>
      <div className="border-t border-line bg-pearl px-5 py-4">{footer}</div>
    </div>
  );
}

function Nav({
  back,
  next,
  label,
  disabled,
}: {
  back: () => void;
  next: () => void;
  label?: string;
  disabled?: boolean;
}) {
  const { t } = useT();
  return (
    <div className="flex gap-2">
      <Button variant="ghost" onClick={back}>
        {t("back")}
      </Button>
      <Button className="flex-1" onClick={next} disabled={disabled}>
        {label ?? t("next")}
      </Button>
    </div>
  );
}

const FEATURES: Key[] = ["feat.rec", "feat.limits", "feat.tejoori", "feat.reinvest"];

export function Welcome() {
  const { t, m } = useT();
  const start = useDemo((s) => s.start);
  const loadSample = useDemo((s) => s.loadSample);
  const [pick, setPick] = useState<"ahmed" | "fatima">("ahmed");
  const [type, setType] = useState<"personal" | "family">("personal");
  return (
    <Frame
      footer={
        <Button className="w-full" onClick={() => start(pick, type)}>
          {t("welcome.start", { name: t(`persona.${pick}`) })}
        </Button>
      }
    >
      <Logo className="h-auto w-44" />
      <h1 className="mt-5 text-[1.9rem] leading-[1.1] font-extrabold text-ink">
        {t("welcome.title")}
      </h1>
      <p className="mt-3 text-muted">{t("welcome.body")}</p>
      <Button variant="dark" className="mt-5 w-full" onClick={loadSample}>
        {t("welcome.sample")}
      </Button>
      <ul className="mt-5 grid gap-2">
        {FEATURES.map((k, i) => (
          <li key={k} className={`rounded-2xl p-3.5 ${i === 3 ? "bg-ink text-white" : "bg-paper"}`}>
            <span className="block font-bold">{t(k)}</span>
            <span className={`block text-sm ${i === 3 ? "text-white/80" : "text-muted"}`}>
              {t(`${k}.d` as Key)}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-7 text-sm font-semibold text-muted">{t("welcome.or")}</p>
      <h2 className="mt-2 mb-2 font-bold">{t("type.title")}</h2>
      <Segmented<"personal" | "family">
        label={t("type.title")}
        value={type}
        onChange={setType}
        options={[
          { value: "personal", label: t("type.personal") },
          { value: "family", label: t("type.family") },
        ]}
      />
      <p className="mt-2 text-sm text-muted">{t(`type.${type}.d`)}</p>

      <h2 className="mt-7 mb-2 font-bold">{t("welcome.pick")}</h2>
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
              {t("persona.salary", { x: m(p.salary) })}
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
        <Nav
          back={() => set({ stage: "welcome" })}
          next={() => set({ stage: "reading" })}
          label={t("consent.approve")}
        />
      }
    >
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white"
        aria-hidden="true"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 10h16M6 10v8M10 10v8M14 10v8M18 10v8M3 20h18M12 3l9 5H3z" />
        </svg>
      </div>
      <h1 className="text-2xl font-extrabold text-ink">{t("consent.title")}</h1>
      <p className="mt-3 text-muted">{t("consent.body")}</p>
      <Card className="mt-5 grid gap-3">
        {(["consent.read", "consent.pay"] as Key[]).map((k) => (
          <div key={k} className="flex items-center gap-3">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full bg-mist text-brand"
              aria-hidden="true"
            >
              ✓
            </span>
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
  const rate = recommendRate(p, s.minRate, s.maxRate);
  const rows: [Key, string][] = [
    ["reading.salary", m(p.salary)],
    ["reading.essentials", m(p.essentials)],
    ["reading.other", m(p.other)],
  ];
  return (
    <Frame
      step={2}
      footer={
        <Nav back={() => s.set({ stage: "consent" })} next={() => s.set({ stage: "risk" })} />
      }
    >
      <h1 className="text-2xl font-extrabold text-ink">{t("reading.title")}</h1>
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
      <Card className="mt-3">
        <p className="mb-1 font-bold">{t("reading.breakdown")}</p>
        <ul className="divide-y divide-line text-sm">
          {SAMPLE_SPENDING[p.id].map((r) => (
            <li key={r.cat} className="flex items-center justify-between gap-3 py-2">
              <span>
                {t(`cat.${r.cat}` as Key)}{" "}
                <span
                  className={`ms-1 rounded px-1.5 py-0.5 text-[11px] font-semibold ${r.essential ? "bg-mist text-brand" : "bg-ink text-white"}`}
                >
                  {t(r.essential ? "reading.essential" : "reading.optional")}
                </span>
              </span>
              <span className="tnum font-semibold">{m(r.amount)}</span>
            </li>
          ))}
        </ul>
      </Card>
      <div className="mt-4 rounded-2xl bg-brand p-4 text-white">
        <p className="font-semibold">
          {t("reading.rate", { r: rate, a: m(round3((p.salary * rate) / 100)) })}
        </p>
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
        <Nav
          back={() => set({ stage: "reading" })}
          next={() => set({ risk, term: TERM_FOR_RISK[risk], stage: "plan" })}
        />
      }
    >
      <h1 className="text-2xl font-extrabold text-ink">{t("risk.title")}</h1>
      {[1, 2, 3].map((q, qi) => (
        <fieldset key={q} className="mt-5">
          <legend className="mb-2 font-semibold">{t(`risk.q${q}` as Key)}</legend>
          <Segmented
            label={t(`risk.q${q}` as Key)}
            value={String(ans[qi])}
            options={[0, 1, 2].map((v) => ({
              value: String(v),
              label: t(`risk.q${q}.${v}` as Key),
            }))}
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

export function Plan() {
  const { t } = useT();
  const s = useDemo();
  const paths: Path[] = ["tejoori", "split", "invest"];
  const next = () => (usesTejoori(s) ? s.set({ stage: "tejoori" }) : s.finishOnboarding());
  return (
    <Frame
      step={4}
      footer={
        <Nav
          back={() => s.set({ stage: "risk" })}
          next={next}
          label={usesTejoori(s) ? t("next") : t("path.finish")}
        />
      }
    >
      <h1 className="text-2xl font-extrabold text-ink">{t("plan.title")}</h1>
      <div role="radiogroup" aria-label={t("plan.title")} className="mt-5 grid gap-2">
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

      {s.path === "split" && (
        <Card className="mt-4">
          <label htmlFor="split" className="font-semibold">
            {t("split.label")}
          </label>
          <div className="mt-1 flex justify-between text-sm font-semibold">
            <span className="text-brand">{t("split.save", { x: 100 - s.investPct })}</span>
            <span className="text-ink">{t("split.invest", { x: s.investPct })}</span>
          </div>
          <input
            id="split"
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
        <div className="mt-4">
          <Notice tone="warn">{t("path.warn")}</Notice>
        </div>
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
                  s.set(
                    k === "minRate"
                      ? { minRate: Math.min(v, s.maxRate) }
                      : { maxRate: Math.max(v, s.minRate) },
                  );
                }}
              >
                {[0, 5, 10, 15, 20, 25, 30].map((v) => (
                  <option key={v} value={v}>
                    {v}%
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </Card>

      {s.path !== "tejoori" && (
        <Card className="mt-4">
          <h2 className="font-bold">{t("term.title")}</h2>
          <p className="mb-2 text-sm text-muted">
            {t("term.note", { r: t(`term.${TERM_FOR_RISK[s.risk]}` as Key) })}
          </p>
          <Segmented<string>
            label={t("term.title")}
            value={String(s.term)}
            onChange={(v) => s.set({ term: Number(v) as Term })}
            options={[3, 6, 12].map((v) => ({ value: String(v), label: t(`term.${v}` as Key) }))}
          />
        </Card>
      )}
    </Frame>
  );
}

export function TejooriSetup() {
  const { t, m } = useT();
  const s = useDemo();
  const [deposit, setDeposit] = useState(String(s.openingDeposit));
  const [goal, setGoal] = useState(String(s.goalAmount));
  const [name, setName] = useState(s.goalName);
  const [touched, setTouched] = useState(false);
  const p = PERSONAS.find((x) => x.id === s.personaId)!;
  const d = Number(deposit);
  const g = Number(goal);
  const depositErr = !(Number.isFinite(d) && d >= TEJOORI_MIN);
  const goalErr = !(Number.isFinite(g) && g > d);
  const rate = recommendRate(p, s.minRate, s.maxRate);
  const share = s.path === "split" ? (100 - s.investPct) / 100 : s.path === "invest" ? 0 : 1;
  const monthly =
    round3((p.salary * rate * share) / 100) +
    (s.accountType === "family" ? FAMILY_MEMBER_AMOUNT : 0);
  const finish = () => {
    setTouched(true);
    if (depositErr || goalErr) return;
    s.set({ openingDeposit: d, goalAmount: g, goalName: name.trim() });
    s.finishOnboarding();
  };
  const input = "tnum mt-1 block min-h-11 w-full rounded-lg border border-line bg-paper px-3";
  return (
    <Frame
      step={5}
      footer={<Nav back={() => s.set({ stage: "plan" })} next={finish} label={t("path.finish")} />}
    >
      <h1 className="text-2xl font-extrabold text-ink">{t("tejoori.title")}</h1>
      {s.accountType === "family" && (
        <p className="mt-2 inline-block rounded-md bg-ink px-2 py-0.5 text-xs font-semibold text-white">
          {t("family.badge")}
        </p>
      )}
      <Card className="mt-5 grid gap-4">
        <label className="text-sm font-semibold">
          {t("tejoori.goalName")}
          <input
            className={input}
            value={name}
            maxLength={40}
            placeholder={t("tejoori.goalPh")}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="text-sm font-semibold">
          {t("tejoori.goalAmount")}
          <input
            className={input}
            inputMode="decimal"
            value={goal}
            aria-invalid={touched && goalErr}
            aria-describedby={touched && goalErr ? "goal-err" : undefined}
            onChange={(e) => setGoal(e.target.value.replace(/[^\d.]/g, ""))}
          />
          {touched && goalErr && (
            <span id="goal-err" className="mt-1 block font-medium text-brand">
              {t("err.goal")}
            </span>
          )}
        </label>
        <label className="text-sm font-semibold">
          {t("tejoori.deposit")}
          <input
            className={input}
            inputMode="decimal"
            value={deposit}
            aria-invalid={touched && depositErr}
            aria-describedby="dep-note"
            onChange={(e) => setDeposit(e.target.value.replace(/[^\d.]/g, ""))}
          />
          <span
            id="dep-note"
            className={`mt-1 block ${touched && depositErr ? "font-medium text-brand" : "font-normal text-muted"}`}
          >
            {touched && depositErr ? t("err.deposit") : t("tejoori.depositNote")}
          </span>
        </label>
      </Card>
      {!goalErr && !depositErr && monthly > 0 && (
        <p className="mt-4 text-sm text-muted">
          {t("tejoori.eta", { a: m(monthly), g: m(g), n: monthsToGoal(g, d, monthly) })}
        </p>
      )}
    </Frame>
  );
}
