# Khata

A private, offline expense tracker for the phone, built from the Claude Design handoff in `../project/Khata.dc.html` and styled with the Organic design system (`src/organic.css`, copied from `../project/_ds/`).

It is an installable PWA (Vite + React + TypeScript). There is no account and no server: all data is kept in `localStorage` on the device, and Settings has an **Export CSV** button.

```sh
npm install
npm run dev      # http://localhost:5173
npm test         # model unit tests
npm run build    # production build + service worker in dist/
```

## Where things are

- `src/model.ts`: the data shape, Indian ₹ formatting, date helpers, storage, warning levels, auto-filing of monthly amounts, and CSV export. These are pure functions and are unit tested.
- `src/App.tsx`: the shell. It holds the state, saves it, keeps navigation in browser history so the phone's back button walks back through screens, sheets and dialogs, and shows the toast with Undo.
- `src/screens/`:
  - `Setup` (Welcome, Categories, Budgets)
  - `Overview`
  - `LogSheet`: logging flow A, keypad first and then a review step
  - `Insights`
  - `Detail`: the category page and its dialogs (budget, rename, subcategory, quick amount, edit entry, merge, delete)
  - `Settings`

## How it differs from the prototype

- It runs on the real date instead of the prototype's fixed 23 September 2026. A fresh install starts with no entries, on the Welcome screen.
- Only logging flow **A** is built. Flow B from the design was left out.
- The prototype's screen list, variant switcher and phone frame are gone. On a phone the app fills the screen; on a wider screen it sits in a centred column.
- Insights shows up to the last 3 months, never going back before the month you started tracking.
- "Same-every-month" quick amounts are filed automatically on the 1st of each new month, starting the month after setup. They show up in a toast with Undo.

## Deploying

Every push to `main` runs `.github/workflows/deploy.yml`. It tests the app, builds it with `BASE=/<repo-name>/` and publishes it to GitHub Pages at `https://suraj-kumar24.github.io/expense-tracker/`. This needs a one-time setting in the repo: **Settings → Pages → Source: GitHub Actions**.
