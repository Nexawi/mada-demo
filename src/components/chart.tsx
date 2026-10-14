import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useT } from "../i18n";
import { useDemo } from "../store";
import { locale } from "./live";

const BRAND = "#55267e";
const ACCENT = "#51c1ad";

/** Stacked area of emergency fund and investments, one point per simulated month. */
export default function BalanceChart() {
  const { t, m, lang } = useT();
  const history = useDemo((s) => s.history);
  if (history.length < 2) return null;
  const short = new Intl.DateTimeFormat(locale(lang), { month: "short" });
  const data = history.map((h) => ({ ...h, label: short.format(new Date(2026, 9 + h.month, 1)) }));
  return (
    <div className="mt-4 rounded-2xl bg-paper p-4">
      <p className="mb-2 text-sm font-bold text-muted">{t("chart.title")}</p>
      <div className="h-40" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="label"
              reversed={lang === "ar"}
              tickLine={false}
              axisLine={false}
              fontSize={11}
              interval="preserveStartEnd"
            />
            <YAxis hide />
            <Tooltip
              formatter={(v, name) => [
                m(Number(v)),
                name === "emergency" ? t("home.emergency") : t("home.invested"),
              ]}
              contentStyle={{ borderRadius: 12, border: "1px solid #ddd4e7", fontSize: 12 }}
            />
            <Area
              type="monotone"
              dataKey="emergency"
              stackId="1"
              stroke={BRAND}
              fill={BRAND}
              fillOpacity={0.25}
              strokeWidth={2}
              animationDuration={450}
            />
            <Area
              type="monotone"
              dataKey="invested"
              stackId="1"
              stroke={ACCENT}
              fill={ACCENT}
              fillOpacity={0.35}
              strokeWidth={2}
              animationDuration={450}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
