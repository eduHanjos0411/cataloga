# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Cataloga is a client-only React 19 + TypeScript + Vite app for library cataloging: the user enters an ISBN, the app fetches bibliographic data, the user reviews/edits it in a form, and exports a MARC 21 record (`.mrc`, ISO 2709). There is no backend. UI text, comments and commit messages are in Brazilian Portuguese (commits follow Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`).

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — type-check (`tsc -b`) then production build to `dist/`
- `npm run lint` — ESLint (flat config in `eslint.config.js`)
- `npm run preview` — serve the built `dist/`

There is no test suite or test runner configured.

## Architecture

Data flows in one direction: **BrasilAPI → `api.ts` → `normalizeBookData` → `BookFormState` → review form → `marcUtils` → `.mrc` download**.

- **`src/api.ts`** — Queries `https://brasilapi.com.br/api/isbn/v1/{isbn}?providers=<p>` for *all* providers (`cbl`, `mercado-editorial`, `open-library`, `google-books`) in parallel. The chosen provider (or the first in `PROVIDERS` in "auto" mode) takes priority; empty `FILLABLE_FIELDS` are filled from the others in order; `subjects` are merged across all sources (case-insensitive dedupe, machine tags like `nyt:...=...` filtered out). `provider` in the result becomes a `" + "`-joined list of contributing sources. Adding a new mergeable field means updating both `BookFormState` and `FILLABLE_FIELDS`.
- **`src/utils/bookUtils.ts`** — `BookFormState` is the central data type shared by the API layer, the form and the MARC exporter. `normalizeBookData` maps raw BrasilAPI JSON (snake_case: `page_count`, `cover_url`, `retail_price`, `dimensions`) into it. Authors are a single string: joined with `"; "` when names are already inverted ("SILVA, José"), otherwise `", "` — `marcUtils.splitAuthors` relies on this convention.
- **`src/hooks/useBookSearch.ts`** — Holds all search/form state. `searchId` increments per successful search and is used as the `key` of `BookReviewPanel` in `App.tsx` to remount the form.
- **`src/components/fields/ParsedField.tsx`** — For non-string values (numbers, price, subject lists) it keeps a local text draft and reads `value` **only on mount**. That's why the review panel must be remounted (via `searchId` key) when new data arrives rather than just receiving new props.
- **`src/utils/marcUtils.ts`** — Builds the MARC 21 bibliographic record following RDA with ISBD punctuation inside subfields (leader, 001/005/008, 020, 100, 245, 264, 300, 336–338, 520, 653, 700, 856). Contains cataloging rules such as name inversion (`invertName`, handling kinship terms like "Filho"), non-filing characters for initial articles (245 ind2), and Brazilian-ISBN detection (prefix 65/85) to set place `bl` and language `por` in 008. `marcjs` field arrays are `[tag, value]` for control fields and `[tag, indicators, code, value, ...]` for data fields (typings in `src/types/marcjs.d.ts`, since the package ships none).

## Node polyfills for marcjs

`marcjs` depends on Node's `stream`, `buffer`, `events` and `util`. Instead of a polyfill plugin, `vite.config.ts` aliases them to `stream-browserify`, `buffer/`, `events/` (trailing slash forces the npm package over the Node builtin) and a stub `src/shims/util.ts`. `marcUtils.ts` also sets `globalThis.Buffer`, which the ISO 2709 formatter requires. Keep these in place when touching the build config or exporter.

## Styling

Plain CSS, one `.css` file per component folder. Theming uses CSS custom properties defined under `.app-shell.light` / `.app-shell.dark` in `src/styles/theme.css`; the theme class is toggled on the root `app-shell` element in `App.tsx`.
