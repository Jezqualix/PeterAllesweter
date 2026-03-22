# Chat Markdown Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render LLM chat responses as formatted markdown (bold, bullet lists, paragraphs) instead of raw plain text.

**Architecture:** Add `react-markdown` to `ChatMessage.tsx` so assistant bubbles parse and render markdown. Scope the CSS for rendered markdown elements to a `.chat-prose` class in `globals.css`. Update the LLM system prompt to instruct the model to use markdown. User bubbles remain unchanged (plain text with `whitespace-pre-wrap`).

**Tech Stack:** Next.js 14 (App Router), TypeScript, react-markdown, Tailwind CSS v4

**Spec:** `docs/superpowers/specs/2026-03-22-chat-markdown-rendering-design.md`

---

## File Map

| File | Action | What changes |
|---|---|---|
| `package.json` | Modify | Add `react-markdown` dependency |
| `components/ChatMessage.tsx` | Modify | Use `<ReactMarkdown>` for assistant bubbles; split `whitespace-pre-wrap` to user-only |
| `app/globals.css` | Modify | Add `.chat-prose` scoped styles for rendered markdown |
| `lib/llm.ts` | Modify | Add markdown formatting instruction to system prompt |

---

## Task 1: Install react-markdown

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package**

```bash
npm install react-markdown
```

Expected: installs without peer dependency errors. No version constraint needed — latest is fine.

- [ ] **Step 2: Verify package.json**

Check that `react-markdown` appears in `dependencies` (not `devDependencies`) in `package.json`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add react-markdown dependency"
```

---

## Task 2: Add .chat-prose styles to globals.css

**Files:**
- Modify: `app/globals.css`

These styles are plain CSS (no `@apply`) appended at the end of `app/globals.css`. They are scoped to `.chat-prose` so they only affect the assistant chat bubble.

Current end of file (line 71): the file ends after `@keyframes blink { ... }`.

- [ ] **Step 1: Append the .chat-prose block**

Add the following at the very end of `app/globals.css` (after the `@keyframes blink` block):

```css
/* Markdown rendering in assistant chat bubbles */
.chat-prose p {
  margin-bottom: 0.5rem;
}
.chat-prose p:first-child {
  margin-top: 0;
}
.chat-prose p:last-child {
  margin-bottom: 0;
}
.chat-prose ul {
  list-style: disc;
  padding-left: 1.25rem;
  margin-bottom: 0.5rem;
}
.chat-prose ol {
  list-style: decimal;
  padding-left: 1.25rem;
  margin-bottom: 0.5rem;
}
.chat-prose li {
  margin-bottom: 0.15rem;
}
.chat-prose strong {
  font-weight: 600;
}
.chat-prose em {
  font-style: italic;
}
.chat-prose hr {
  border: none;
  border-top: 1px solid #d6d6d6;
  margin: 0.5rem 0;
}
```

- [ ] **Step 2: Verify the dev server starts without CSS errors**

```bash
npm run dev
```

Expected: server starts, no CSS parse errors. Stop with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: add .chat-prose styles for markdown rendering in assistant bubble"
```

---

## Task 3: Update ChatMessage.tsx to render markdown

**Files:**
- Modify: `components/ChatMessage.tsx`

Current file for reference:

```tsx
import React from 'react';
import { Car, User } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${isUser ? 'bg-brand-600' : 'bg-[#494949]'}`}>
        {isUser
          ? <User className="h-4 w-4 text-white" />
          : <Car className="h-4 w-4 text-white" />
        }
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-brand-600 text-white rounded-tr-sm'
            : 'bg-[#f3f3f3] text-[#494949] border border-[#d6d6d6] rounded-tl-sm'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
```

Two changes needed:
1. Import and use `ReactMarkdown` for assistant bubbles (`!isUser`)
2. Move `whitespace-pre-wrap` from the shared bubble `className` to the user bubble branch only

- [ ] **Step 1: Replace the full file content**

Replace the entire file with:

```tsx
import React from 'react';
import { Car, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage as ChatMessageType } from '@/types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${isUser ? 'bg-brand-600' : 'bg-[#494949]'}`}>
        {isUser
          ? <User className="h-4 w-4 text-white" />
          : <Car className="h-4 w-4 text-white" />
        }
      </div>

      {/* Bubble */}
      {isUser ? (
        <div className="max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap bg-brand-600 text-white rounded-tr-sm">
          {message.content}
        </div>
      ) : (
        <div className="chat-prose max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed bg-[#f3f3f3] text-[#494949] border border-[#d6d6d6] rounded-tl-sm">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the dev server compiles without errors**

```bash
npm run dev
```

Expected: server starts, no TypeScript or module errors in terminal. Open `http://localhost:3000`, open the chat widget, and verify:
- The welcome message "Goedag! Ik ben de virtuele assistent..." renders as normal text (no visual change expected here since it has no markdown)
- User messages still display with the green background bubble
- No layout shifts or broken styling

Stop with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add components/ChatMessage.tsx
git commit -m "feat: render assistant chat bubbles with react-markdown"
```

---

## Task 4: Update the LLM system prompt

**Files:**
- Modify: `lib/llm.ts`

The system prompt currently starts (line 19):

```
Je bent een klantenservice-assistent voor PeterAllesweter autoverhuur (België). Antwoord in het Nederlands. Wees vriendelijk en bondig.
```

- [ ] **Step 1: Add markdown instruction after the opening line**

In `lib/llm.ts` at line 19, find this exact text inside the template literal:

```
Wees vriendelijk en bondig.

Je kan klanten helpen met:
```

Replace it with:

```
Wees vriendelijk en bondig.

Gebruik markdown-opmaak in je antwoorden: **vetgedrukt** voor labels en belangrijke waarden, - opsommingstekens voor meerdere opties of voertuigen. Gebruik geen koppen (#) of code-blokken.

Je kan klanten helpen met:
```

Only this insertion — do not change anything else in the file.

- [ ] **Step 2: Verify the file is syntactically correct**

```bash
npx tsc --noEmit
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add lib/llm.ts
git commit -m "feat: instruct LLM to use markdown formatting in chat responses"
```

---

## Task 5: Build verification

**Files:** none modified

- [ ] **Step 1: Run a production build**

```bash
npm run build
```

Expected: exits with code 0. No errors about missing modules or type failures.

- [ ] **Step 2: Start the production server and verify manually**

```bash
npm start
```

Open `http://localhost:3000` and test the chat widget:

1. Send a message asking about available vehicles (e.g. "Welke auto's zijn beschikbaar?")
2. Verify the response renders with formatted markdown: bullet list, bold text — not raw `**` characters
3. Send a second message and verify streaming works (text appears progressively, no visible flicker at completion)
4. Verify user bubbles still display as plain green text bubbles

Stop with Ctrl+S / Ctrl+C.

- [ ] **Step 3: Final state**

No files were modified in Task 5. No commit needed. If a visual regression was found and fixed, commit only the changed file:

```bash
git add <file>
git commit -m "fix: <description> after markdown rendering feature"
```

---

## Done

All tasks complete when:
- `npm run build` exits with code 0
- LLM responses in the chat show formatted bold text and bullet lists
- User bubbles are visually unchanged
- Streaming renders progressively without layout breaks
