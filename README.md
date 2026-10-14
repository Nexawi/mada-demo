# Mada — demo web app

Mada is a clickable concept demo of engine-recommended saving and Sharia-compliant Sukuk investing for Bahrain Islamic Bank (BisB) customers. All data is simulated in the browser; no bank or API is contacted.

## What it shows
- Personal or family account; family accounts share one Tejoori that a second member also saves into.
- Monthly recommendation: a savings engine (open banking data in the real product, simulated here) recommends the rate; the customer accepts or keeps the current one. The rate always stays within the limits set at account creation.
- Tejoori savings account with a named goal (minimum BD 50 to open). When the goal is reached the customer chooses to keep saving there or move new saving to investing.
- Investment account: fractional Sukuk bought in BD 100 steps at the term the customer picks (3, 6 or 12 months). Profit is always reinvested.
- Bank fee is a share of profit only (example: 20%); no profit, no fee. Tejoori is free.
- Zakat estimate, purification and certification notes; prize draw on Tejoori (pending a Sharia ruling); liquid portion; withdrawals with a cooling-off step in a market dip.
- Demo controls: play/pause with speed, next month, run 6 months, scenarios. English and Arabic (RTL), phone and desktop layouts.

## Setup
```bash
pnpm install
pnpm dev        # local dev server
pnpm test       # engine unit tests
pnpm typecheck && pnpm lint
pnpm build      # production build in dist/
```

No environment variables are needed.

## Assumptions (illustrative, not real figures)
- Sukuk profit rates: 4.5% (3 months), 5% (6 months), 5.5% (12 months).
- Bank share of profit: 20%.
- Family member contribution: BD 100 a month.
- Demo nisab: BD 2,500. The real nisab follows the gold price and the Sharia board.
- Engine stand-in: 60% of last month's free cash as a share of salary, within the customer's limits.

## Structure
- `src/engine.ts` — pure simulation rules (tested in `src/engine.test.ts`)
- `src/store.ts` — state and month simulation (Zustand, saved in localStorage)
- `src/i18n.ts` — English/Arabic strings and number/date formatting
- `src/screens/` — onboarding and main tabs
- `src/components/ui.tsx` — shared components
