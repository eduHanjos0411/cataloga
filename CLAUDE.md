# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Cataloga is a client-only React 19 + TypeScript + Vite app for library cataloging: the user enters an ISBN, the app fetches bibliographic data, the user reviews/edits it in a form, and exports a MARC 21 record (`.mrc`, ISO 2709). There is no backend. UI text, comments and commit messages are in Brazilian Portuguese (commits follow Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`).

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — type-check (`tsc -b`) then production build to `dist/`
- `npm run lint` — ESLint (flat config in `eslint.config.js`)
- `npm run preview` — serve the built `dist/`
- `npm run avaliar -- <amostra.csv>` — `scripts/avaliar-fontes.mjs` loads `src/avaliacao/avaliarFontes.ts` through Vite and queries each provider in isolation for the thesis' source evaluation (Cap. 5); results go to the gitignored output folder. See `docs/tcc/resultados/programa-avaliacao.md`.

There is no test suite or test runner configured.

## Architecture

Data flows in one direction: **providers → `api.ts` → `normalizeBookData` → `BookFormState` → review form → `marcUtils` → `.mrc` download**.

- **`src/api.ts`** — Validates the ISBN check digit locally (`isValidIsbn`, from `bookUtils.ts`), then queries *all* providers in parallel, each through its adapter in `src/providers/`: `cbl` and `mercado-editorial` via BrasilAPI (`/api/isbn/v1/{isbn}?providers=<p>`; its 400 is treated as not-found because it rejects some valid ISBNs), `open-library` and `google-books` directly. Adapters return BrasilAPI-shaped JSON so `normalizeBookData` stays the single mapper. Google Books is only in `PROVIDERS` when `VITE_GOOGLE_BOOKS_API_KEY` is set (the anonymous quota is usually exhausted); Open Library subjects are capped at `MAX_SUBJECTS`. The chosen provider (or the first in `PROVIDERS` in "auto" mode) takes priority; empty `FILLABLE_FIELDS` are filled from the others in order; `subjects` are merged across all sources (case-insensitive dedupe, machine tags like `nyt:...=...` filtered out). `provider` in the result becomes a `" + "`-joined list of contributing sources. Each provider request is aborted after `PROVIDER_TIMEOUT_MS` and counts as a provider failure. Adding a new mergeable field means updating both `BookFormState` and `FILLABLE_FIELDS`.
- **`src/utils/bookUtils.ts`** — `BookFormState` is the central data type shared by the API layer, the form and the MARC exporter. `normalizeBookData` maps raw BrasilAPI JSON (snake_case: `page_count`, `cover_url`, `retail_price`, `dimensions`) into it. Authors are a single string always joined with `"; "` (commas belong to inverted names like "SILVA, José") — `marcUtils.splitAuthors` splits only on `;`. `language` is a 3-letter MARC code (Open Library `/languages/por`, Google Books ISO 639-1 mapped) used in 008/35-37; there is no price field.
- **`src/hooks/useBookSearch.ts`** — Holds the batch (`BatchItem[]`, each with `status` `loading`/`found`/`error`) and the current page. The ISBN input accepts several ISBNs (newline/comma/semicolon separated; spaces are ignored when the joined text is a valid ISBN and only split when every piece is ISBN-sized — `parseIsbnList`); new ones are appended to a single queue shared by all searches, with at most `MAX_CONCURRENT_SEARCHES` ISBNs in flight. Each run is timed (`lastRun`, shown in `BatchPager`) and found items record `failedProviders`. The batch is persisted to `localStorage` (`cataloga:lote`, with a `version`; older batches get their authors migrated to the `;` format); items still loading on reload become errors ("Busca interrompida").
- **`src/components/BatchPager/`** — Google-style pagination (one document per page) plus the batch actions. Batch export concatenates the ISO 2709 records into a single `.mrc` (`exportBatchToMarc`), skipping items that aren't `found`; each page can also export its own record.
- **`src/components/fields/ParsedField.tsx`** — For non-string values (numbers, price, subject lists) it keeps a local text draft and reads `value` **only on mount**. That's why `BookReviewPanel` is keyed by the batch item `id` in `App.tsx`: changing pages remounts the form rather than just passing new props.
- **`src/utils/marcUtils.ts`** — Builds the MARC 21 bibliographic record with ISBD punctuation inside subfields (leader, 001/005/008, 020, 100, 245, 250, 264, 300, 336–338, 520, 653, 700, 856) under a `CatalogingRules` profile: `rda` (default) or `aacr2` (leader/18 `a`, 260 with `[S.l.]`/`[s.n.]` and no `[s.d.]` (AACR2 1.4F7 needs a probable date such as `[199-?]`, typed by the librarian; without it 260 $c is omitted and the form warns), rule of three for more than three authors, abbreviated 300, no 336–338, 245 $h GMD for digital). The choice is a UI setting persisted in `localStorage` (`cataloga:regras`) and passed to the viewer and exporters. Inside this file `Record` is marcjs' class, not the TS utility type. Contains cataloging rules such as name inversion (`invertName`, handling kinship terms like "Filho"), non-filing characters for initial articles (245 ind2), and Brazilian-ISBN detection (prefix 65/85) to set place `bl` and language `por` in 008. `marcjs` field arrays are `[tag, value]` for control fields and `[tag, indicators, code, value, ...]` for data fields (typings in `src/types/marcjs.d.ts`, since the package ships none).

## Node polyfills for marcjs

`marcjs` depends on Node's `stream`, `buffer`, `events` and `util`. Instead of a polyfill plugin, `vite.config.ts` aliases them to `stream-browserify`, `buffer/`, `events/` (trailing slash forces the npm package over the Node builtin) and a stub `src/shims/util.ts`. `marcUtils.ts` also sets `globalThis.Buffer`, which the ISO 2709 formatter requires. Keep these in place when touching the build config or exporter.

## Styling

Plain CSS, one `.css` file per component folder. Theming uses CSS custom properties defined under `.app-shell.light` / `.app-shell.dark` in `src/styles/theme.css`; the theme class is toggled on the root `app-shell` element in `App.tsx`.

## UI conventions

No `alert`/`confirm`/`console.*`: confirmations use `ConfirmDialog` (native `<dialog>`) and short messages use `Toast`, both owned by `App.tsx`.

## Thesis materials

`docs/` is gitignored (local only). `docs/tcc/latex/` mirrors the Overleaf project (the source of truth for the thesis text; sync it from Overleaf, don't edit it here first). `docs/tcc/resultados/` holds the test sheets and the evaluation guide.
