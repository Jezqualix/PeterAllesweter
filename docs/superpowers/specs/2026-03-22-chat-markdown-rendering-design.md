# Chat Markdown Rendering — Design Spec

**Date:** 2026-03-22
**Project:** PeterAllesweter
**Scope:** Render LLM responses as formatted markdown in the chat bubble instead of plain text

---

## Goal

The LLM assistant currently outputs markdown syntax (`**vet**`, `- lijstitem`) that is displayed as raw characters. This change renders those as proper formatted output (bold, bullet lists, paragraphs) so responses are easier to read and scan.

---

## Approach

Add `react-markdown` to parse and render markdown in assistant chat bubbles. Update the LLM system prompt to instruct the model to use markdown formatting. User bubbles remain plain text.

---

## Files Changed

| File | Change |
|---|---|
| `package.json` | Add `react-markdown` dependency |
| `components/ChatMessage.tsx` | Replace `{message.content}` with `<ReactMarkdown>` for assistant messages |
| `lib/llm.ts` | Add markdown formatting instruction to system prompt |

---

## Component Design

### `ChatMessage.tsx`

- **User bubble:** unchanged — renders `{message.content}` as plain text with `whitespace-pre-wrap`
- **Assistant bubble:** replace `{message.content}` with `<ReactMarkdown>` component
  - Remove `whitespace-pre-wrap` from the bubble (markdown handles line breaks)
  - Add prose-style CSS for the rendered elements (see Styles section)

### Markdown element styles (scoped to assistant bubble)

Applied via a wrapper `div` with a class (e.g. `chat-prose`) — no Tailwind Typography plugin needed:

| Element | Style |
|---|---|
| `p` | `margin-bottom: 0.5rem`, no top margin on first child |
| `ul` | `list-style: disc`, `padding-left: 1.25rem`, `margin-bottom: 0.5rem` |
| `ol` | `list-style: decimal`, `padding-left: 1.25rem`, `margin-bottom: 0.5rem` |
| `li` | `margin-bottom: 0.15rem` |
| `strong` | `font-weight: 600` (inherits text color) |
| `em` | `font-style: italic` |
| `hr` | `border-top: 1px solid #d6d6d6`, `margin: 0.5rem 0` |

No `h1`–`h6`, no code blocks, no tables needed — the LLM does not use these in chat responses.

### `lib/llm.ts` — system prompt addition

Add after the opening instruction line:

```
Gebruik markdown-opmaak in je antwoorden: **vetgedrukt** voor labels en belangrijke waarden, - opsommingstekens voor meerdere opties of voertuigen. Gebruik geen koppen (#) of code-blokken.
```

---

## Dependency

**`react-markdown`** — MIT licensed, ~15 kB gzip, no peer dependency conflicts with Next.js 14. No additional plugins (no remark-gfm needed for basic bold/lists/paragraphs, but may be added if needed for tables in future).

---

## Out of Scope

- Inline vehicle cards — not in this change
- Syntax highlighting or code blocks
- Table rendering
- Tailwind Typography plugin (`@tailwindcss/typography`)

---

## Success Criteria

- LLM responses with `**text**` display as bold
- Bullet lists (`-` or `*`) display as proper `<ul>` lists
- Numbered lists display as `<ol>`
- User bubbles are unchanged
- Streaming works correctly during response generation (markdown renders progressively)
- No visual regressions on existing messages
