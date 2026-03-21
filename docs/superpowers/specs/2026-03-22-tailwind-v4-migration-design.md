# Tailwind CSS v4 Migration — Design Spec

**Date:** 2026-03-22
**Project:** PeterAllesweter
**Scope:** Upgrade Tailwind CSS from v3.4.x to v4.x (full CSS-first migration)

---

## Goal

Migrate the project from Tailwind CSS v3 to v4 using the full CSS-first approach (no compatibility mode). The `tailwind.config.ts` file will be removed and all configuration moved into `globals.css` using the `@theme {}` block.

---

## Approach

Use the official `@tailwindcss/upgrade` tool as a base, followed by manual verification and correction of output — particularly for custom brand colors and `@apply` usage.

---

## Steps

### 1. Update packages

- Upgrade `tailwindcss` to `^4.x`
- Add `@tailwindcss/postcss` (new PostCSS plugin for v4)
- Remove `autoprefixer` (now built into Tailwind v4)

### 2. Run upgrade tool

```bash
npx @tailwindcss/upgrade
```

Use as a starting point. Review all generated output before accepting.

### 3. Update postcss.config.js

**Before:**
```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**After:**
```js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

### 4. Migrate globals.css

**Before:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**After:**
```css
@import "tailwindcss";
```

Add `@theme {}` block with all custom design tokens (replacing `tailwind.config.ts` theme):

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

The existing `:root` CSS variables, `@apply btn-cta`, and other custom CSS remain unchanged.

### 5. Remove tailwind.config.ts

Delete the file — all configuration is now in `globals.css`.

### 6. Visual verification

Run `npm run dev` and check:
- Homepage: hero gradient, vehicle cards, brand-colored navbar
- Admin dashboard: tables, badges, buttons
- Login page: form inputs, button styles
- Chat widget: streaming cursor, brand colors

---

## Files Changed

| File | Change |
|---|---|
| `package.json` | Upgrade `tailwindcss`, add `@tailwindcss/postcss`, remove `autoprefixer` |
| `postcss.config.js` | Replace plugins |
| `app/globals.css` | Replace `@tailwind` directives with `@import`, add `@theme {}` |
| `tailwind.config.ts` | **Delete** |

---

## Risk

- `@apply` with custom utilities (e.g. `btn-cta`) still works in v4 — low risk
- `darkMode: ['class']` config in v4 is handled differently — needs verification
- Class name changes: some v3 utilities were renamed in v4 (e.g. `shadow-sm` behavior) — verify visually

---

## Success Criteria

- `npm run build` completes without errors
- All pages render with correct Dockx brand colors and layout
- No visual regressions on homepage, admin, login, and chat
