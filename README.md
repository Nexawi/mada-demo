# Halal Auto-Invest — demo web app

Clickable concept demo of an automated, Sharia-compliant saving and investing account for Bahrain Islamic Bank (BisB) customers. All data is simulated in the browser; no bank or API is contacted.

## What it shows
- Onboarding: demo customer, simulated BENEFIT consent, 12-month transaction read, risk check, path choice (safety first, split, invest directly) and rate limits.
- Monthly saving-rate engine: income up → rate up; income down or essential costs up → rate down; a discretionary spending spike holds the rate. Changes are shown for approval before the deduction.
- Emergency fund (6 months of expenses for private sector, 3 for government) with overflow to investing and a prize-draw display.
- Fractional Sukuk bought in BD 100 steps (3, 6 or 12 months by risk level), automatic or approve-first purchases, maturity with profit reinvested by default, liquid portion.
- Zakat estimate, purification and certification notes; withdrawals with a cooling-off step during a market dip.
- English and Arabic (RTL), phone and desktop layouts. Desktop shows the app in a phone frame beside the demo controls.

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
- Demo nisab: BD 2,500. The real nisab follows the gold price and the Sharia board.
- Starting saving rate: 60% of free cash as a share of salary, within the customer's limits.

## Structure
- `src/engine.ts` — pure simulation rules (tested in `src/engine.test.ts`)
- `src/store.ts` — state and month simulation (Zustand, saved in localStorage)
- `src/i18n.ts` — English/Arabic strings and number/date formatting
- `src/screens/` — onboarding and main tabs
- `src/components/ui.tsx` — shared components
