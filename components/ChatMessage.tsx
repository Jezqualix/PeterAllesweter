'use client';

import React, { useState } from 'react';
import { Car, User, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { ChatMessage as ChatMessageType } from '@/types';

interface ChatMessageProps {
  message: ChatMessageType;
}

// ─── Code block with language label + copy button ─────────────────────────────

function CodeBlock({ className, children }: { className?: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);

  const language = className?.replace('language-', '') ?? '';
  const codeText = typeof children === 'string' ? children : String(children ?? '');

  async function handleCopy() {
    await navigator.clipboard.writeText(codeText.replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-[#d0d0d0] text-sm">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#2d2d2d]">
        <span className="text-xs text-[#9da5b4] font-mono uppercase tracking-wide">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-[#9da5b4] hover:text-white transition-colors"
          aria-label="Kopiëren"
        >
          {copied
            ? <><Check className="h-3.5 w-3.5 text-green-400" /> Gekopieerd!</>
            : <><Copy className="h-3.5 w-3.5" /> Kopiëren</>
          }
        </button>
      </div>
      {/* Code area */}
      <pre className="bg-[#1e1e1e] px-4 py-3 overflow-x-auto m-0">
        <code className={`${className ?? ''} text-[0.8rem] leading-relaxed font-mono`}>
          {children}
        </code>
      </pre>
    </div>
  );
}

// ─── ChatMessage ──────────────────────────────────────────────────────────────

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center shadow-sm ${isUser ? 'bg-brand-600' : 'bg-[#494949]'}`}>
        {isUser
          ? <User className="h-4 w-4 text-white" />
          : <Car className="h-4 w-4 text-white" />
        }
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-brand-600 text-white rounded-tr-sm whitespace-pre-wrap'
            : 'bg-white text-[#494949] border border-[#d6d6d6] shadow-sm rounded-tl-sm'
        }`}
      >
        {isUser ? (
          message.content
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[[rehypeHighlight, { detect: true }]]}
            components={{
              // ── Paragraphs
              p: ({ children }) => (
                <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
              ),

              // ── Headings
              h1: ({ children }) => (
                <h1 className="text-base font-bold text-[#494949] border-l-4 border-brand-600 pl-2.5 mt-3 mb-2 first:mt-0">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-sm font-semibold text-[#494949] mt-3 mb-1.5 first:mt-0">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm font-semibold text-brand-700 mt-2.5 mb-1 first:mt-0">
                  {children}
                </h3>
              ),
              h4: ({ children }) => (
                <h4 className="text-sm font-medium text-[#494949] mt-2 mb-0.5 first:mt-0">
                  {children}
                </h4>
              ),

              // ── Inline formatting
              strong: ({ children }) => (
                <strong className="font-semibold text-[#2d2d2d]">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic text-[#494949]">{children}</em>
              ),

              // ── Lists
              ul: ({ children }) => (
                <ul className="list-none pl-0 mb-3 space-y-1">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed flex gap-2 items-start">
                  <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-brand-600 inline-block" />
                  <span>{children}</span>
                </li>
              ),

              // ── Blockquote
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-brand-600 bg-brand-50 pl-3 pr-2 py-2 my-3 rounded-r-md italic text-[#494949]">
                  {children}
                </blockquote>
              ),

              // ── Link
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 underline underline-offset-2 hover:text-brand-700"
                >
                  {children}
                </a>
              ),

              // ── Horizontal rule
              hr: () => <hr className="my-4 border-[#e0e0e0]" />,

              // ── Tables
              table: ({ children }) => (
                <div className="overflow-x-auto my-3 rounded-lg border border-[#d6d6d6]">
                  <table className="w-full text-xs border-collapse">{children}</table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-brand-50">{children}</thead>
              ),
              tbody: ({ children }) => (
                <tbody className="divide-y divide-[#e8e8e8]">{children}</tbody>
              ),
              tr: ({ children }) => (
                <tr className="even:bg-[#fafafa] odd:bg-white hover:bg-brand-50 transition-colors">
                  {children}
                </tr>
              ),
              th: ({ children }) => (
                <th className="text-left px-3 py-2 font-semibold text-brand-900 text-[10px] uppercase tracking-wide border-b border-[#d6d6d6]">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-3 py-2 text-[#494949] align-top">{children}</td>
              ),

              // ── Code blocks (pre wraps code for fenced blocks)
              pre: ({ children }) => {
                // Extract className from the nested <code> element
                const codeEl = React.Children.toArray(children).find(
                  (c): c is React.ReactElement => React.isValidElement(c) && c.type === 'code'
                );
                const className = codeEl?.props?.className ?? '';
                const codeChildren = codeEl?.props?.children ?? children;
                return <CodeBlock className={className}>{codeChildren}</CodeBlock>;
              },

              // ── Inline code (no pre parent)
              code: ({ className, children }) => {
                // Block code is handled by <pre> above; this is inline only
                if (className) return <code className={className}>{children}</code>;
                return (
                  <code className="bg-[#f0f0f0] rounded px-1.5 py-0.5 text-[0.78rem] font-mono text-[#c7254e]">
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
