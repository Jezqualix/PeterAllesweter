import React from 'react';
import { Car, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? 'bg-brand-600 text-white rounded-tr-sm whitespace-pre-wrap'
            : 'bg-[#f3f3f3] text-[#494949] border border-[#d6d6d6] rounded-tl-sm'
        }`}
      >
        {isUser ? (
          message.content
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Paragraphs
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              // Bold / italic
              strong: ({ children }) => <strong className="font-semibold text-[#494949]">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              // Lists
              ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
              li: ({ children }) => <li className="leading-snug">{children}</li>,
              // Headings
              h3: ({ children }) => <h3 className="font-semibold text-[#494949] mt-2 mb-1">{children}</h3>,
              h4: ({ children }) => <h4 className="font-medium text-[#494949] mt-1.5 mb-0.5">{children}</h4>,
              // Tables (GFM)
              table: ({ children }) => (
                <div className="overflow-x-auto my-2">
                  <table className="w-full text-xs border-collapse">{children}</table>
                </div>
              ),
              thead: ({ children }) => <thead className="bg-[#e8e8e8]">{children}</thead>,
              tbody: ({ children }) => <tbody className="divide-y divide-[#d6d6d6]">{children}</tbody>,
              tr: ({ children }) => <tr className="even:bg-white odd:bg-[#f9f9f9]">{children}</tr>,
              th: ({ children }) => (
                <th className="text-left px-2 py-1 font-semibold text-[#494949] border border-[#d6d6d6]">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-2 py-1 border border-[#d6d6d6] text-[#494949]">{children}</td>
              ),
              // Inline code
              code: ({ children }) => (
                <code className="bg-[#e8e8e8] rounded px-1 py-0.5 text-xs font-mono">{children}</code>
              ),
              // Horizontal rule
              hr: () => <hr className="my-2 border-[#d6d6d6]" />,
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
