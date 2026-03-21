# Tailwind CSS v4 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Tailwind CSS from v3 to v4 using the full CSS-first approach — removing `tailwind.config.ts` and moving all configuration into `globals.css`.

**Architecture:** Install the new `@tailwindcss/postcss` plugin, replace the three `@tailwind` directives with a single `@import "tailwindcss"`, and define all custom design tokens (brand colors, accent colors, font) in a `@theme {}` block directly in `globals.css`. The `tailwind.config.ts` file is deleted entirely.

**Tech Stack:** Next.js 14 (App Router), Tailwind CSS v4, `@tailwindcss/postcss`, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-22-tailwind-v4-migration-design.md`

---

## File Map

| File | Action | What changes |
|---|---|---|
| `package.json` | Modify | Upgrade `tailwindcss` to `^4`, add `@tailwindcss/postcss`, remove `autoprefixer` |
| `postcss.config.js` | Modify | Replace plugin list |
| `app/globals.css` | Modify | Replace `@tailwind` directives, reorder `@import`, add `@theme {}` block |
| `tailwind.config.ts` | Delete | All config moves to `globals.css` |

---

## Task 1: Update packages

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Tailwind v4 and the new PostCSS plugin**

```bash
npm install tailwindcss@latest @tailwindcss/postcss@latest
```

Expected output: packages resolve without peer dependency errors.

- [ ] **Step 2: Remove autoprefixer**

```bash
npm uninstall autoprefixer
```

- [ ] **Step 3: Verify package.json reflects the changes**

Check that `package.json` now has:
- `"tailwindcss": "^4.x.x"` in `devDependencies`
- `"@tailwindcss/postcss": "^..."` in `devDependencies`
- `autoprefixer` is gone from both `dependencies` and `devDependencies`

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: upgrade tailwindcss to v4, add @tailwindcss/postcss, remove autoprefixer"
```

---

## Task 2: Update postcss.config.js

**Files:**
- Modify: `postcss.config.js`

Current content:
```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 1: Replace the plugin list**

Replace the entire file content with:

```js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

- [ ] **Step 2: Verify the dev server starts without PostCSS errors**

> **Note:** At this point `globals.css` still contains `@tailwind base/components/utilities` directives. Under v4, `@tailwindcss/postcss` does not recognise these — you may see CSS parse warnings in the terminal. That is expected and will be resolved in Task 3. What you are checking here is only that the server starts and there is no `Cannot find module 'tailwindcss'` or `Cannot find module 'autoprefixer'` error.

```bash
npm run dev
```

Expected: server starts. Stop with Ctrl+C after confirming no module-not-found errors.

- [ ] **Step 3: Commit**

```bash
git add postcss.config.js
git commit -m "chore: switch postcss plugin to @tailwindcss/postcss for v4"
```

---

## Task 3: Migrate globals.css

**Files:**
- Modify: `app/globals.css`

This is the core migration step. The file currently starts with `@tailwind` directives followed by a `@import url(...)` that is out of order per CSS spec. We fix both.

Current top of file:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
```

- [ ] **Step 1: Replace the @tailwind directives and fix import order**

Replace lines 1–5 of `app/globals.css` with the following (all `@import` statements must come first, before any other rules):

```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
```

- [ ] **Step 2: Add the @theme block directly after the imports**

Insert the following immediately after the two `@import` lines, before the `:root {}` block:

```css
@theme {
  --color-brand-50:  #e8f5ee;
  --color-brand-100: #c3e6d0;
  --color-brand-200: #8dcbaa;
  --color-brand-300: #52ae7e;
  --color-brand-400: #00995a;
  --color-brand-500: #00a040;
  --color-brand-600: #007c30;
  --color-brand-700: #026c3d;
  --color-brand-800: #005526;
  --color-brand-900: #003012;

  --color-accent:       #ffdd00;
  --color-accent-hover: #e6c800;
  --color-accent-light: #fff8cc;

  --font-sans: 'Inter', system-ui, sans-serif;
}
```

- [ ] **Step 3: Verify the final globals.css structure**

The file should now read top-to-bottom in this order:
1. `@import "tailwindcss";`
2. `@import url('https://...')` (Google Fonts)
3. `@theme { ... }` (all custom tokens)
4. `:root { ... }` (CSS custom properties — unchanged)
5. `* { box-sizing: border-box; }` — unchanged
6. `html { ... }` — unchanged
7. `body { ... }` — unchanged
8. Scrollbar styles — unchanged
9. `.btn-cta { @apply ... }` — unchanged
10. `.streaming-cursor::after { ... }` — unchanged
11. `@keyframes blink { ... }` — unchanged

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat: migrate globals.css to Tailwind v4 CSS-first config with @theme block"
```

---

## Task 4: Delete tailwind.config.ts

**Files:**
- Delete: `tailwind.config.ts`

- [ ] **Step 1: Verify nothing imports the config file**

```bash
grep -r "tailwind.config" . --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" --exclude-dir=node_modules
```

Expected: no results (nothing imports it — it is only consumed by the Tailwind PostCSS plugin, which no longer needs it in v4).

- [ ] **Step 2: Stage the deletion and commit**

```bash
git rm tailwind.config.ts
git commit -m "chore: remove tailwind.config.ts — config moved to globals.css @theme block"
```

---

## Task 5: Build verification

**Files:** none modified

- [ ] **Step 1: Run a production build**

```bash
npm run build
```

Expected: build completes with no errors. Warnings about unused CSS are acceptable; errors about missing modules or class resolution are not.

- [ ] **Step 2: Start the production server and verify pages**

```bash
npm start
```

Open `http://localhost:3000` and check each surface:

| Page | What to verify |
|---|---|
| Homepage (`/`) | Navbar is `brand-600` green, hero gradient is dark green, vehicle cards render with correct colors, accent yellow CTA buttons visible, footer heading and icons are yellow (`text-accent`) |
| Admin (`/admin`) | Tables, badges, and buttons render correctly; `bg-accent-light` badge backgrounds visible |
| Login (`/login`) | Form inputs have correct border color, submit button styled |
| Chat widget | Streaming cursor animation visible, brand green color on scrollbar thumb |
| Navbar | Car icon is yellow (`text-accent`) |

- [ ] **Step 3: If visual regressions found**

Common v4 class name changes to check:
- `shadow-sm` / `shadow` — behavior may differ slightly
- `ring` utilities — syntax unchanged in v4
- Any `bg-accent`, `text-brand-*`, `bg-brand-*` classes — these must still work

If a class is missing, verify the `@theme` token name matches the expected utility. For example `--color-brand-600` generates `bg-brand-600`, `text-brand-600`, etc.

- [ ] **Step 4: Final state**

Task 5 modifies no source files — all changes were committed in Tasks 1–4. No commit is needed here. If any visual regressions were fixed in Step 3, commit only the specific files that were changed:

```bash
git add app/globals.css   # or whichever file was changed to fix the regression
git commit -m "fix: correct <class name> after Tailwind v4 migration"
```

---

## Done

All tasks complete when:
- `npm run build` exits with code 0
- All pages render with correct Dockx brand colors
- `tailwind.config.ts` no longer exists in the repo
- `autoprefixer` no longer in `package.json`
