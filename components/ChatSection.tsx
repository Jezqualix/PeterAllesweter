'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, LogIn, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '@/types';

interface ChatSectionProps {
  isAuthenticated: boolean;
  userEmail?: string;
}

const WELCOME: ChatMessage = {
  role: 'assistant',
  content: 'Goedag! Ik ben de digitale assistent van PeterAllesweter. Stel mij gerust een vraag over onze voertuigen, prijzen of beschikbaarheid — ik help u graag verder.',
};

/** Generate a random session ID that is NOT persisted — resets on every page load */
function newSessionId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function ChatSection({ isAuthenticated, userEmail }: ChatSectionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  // Guest sessionId: freshly generated each component mount — never persisted to localStorage
  const sessionId = useRef(isAuthenticated ? (userEmail ?? 'auth-user') : newSessionId());
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll messages container (not the page) to bottom on new message
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const resetSession = useCallback(() => {
    sessionId.current = newSessionId();
    setMessages([WELCOME]);
    setInput('');
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '' }]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: sessionId.current }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText.slice(0, 200)}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No stream');
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const raw = decoder.decode(value, { stream: true });
        const lines = raw.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          const raw = line.slice(6);
          if (raw === '[DONE]') break;
          const data = JSON.parse(raw);
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: updated[updated.length - 1].content + data,
            };
            return updated;
          });
        }
      }
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: `Er is een fout opgetreden. Probeer het opnieuw.\n\n(${detail})`,
        };
        return updated;
      });
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [input, loading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <section id="chat" className="py-16 px-4 bg-white border-t border-[#d6d6d6]">
      <div className="max-w-3xl mx-auto">

        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#494949]">Stel uw vraag</h2>
            <p className="text-sm text-[#616161] mt-1">
              {isAuthenticated
                ? <>Ingelogd als <span className="font-medium text-brand-600">{userEmail}</span> — uw gesprekhistoriek wordt bijgehouden.</>
                : 'Niet ingelogd — uw gesprek wordt na de sessie gewist.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isAuthenticated && (
              <a
                href="/login"
                className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                <LogIn className="h-4 w-4" />
                Inloggen
              </a>
            )}
            {!isAuthenticated && messages.length > 1 && (
              <button
                onClick={resetSession}
                className="flex items-center gap-1.5 text-sm text-[#616161] hover:text-[#494949] ml-3"
                title="Gesprek opnieuw starten"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="border border-[#d6d6d6] rounded-xl overflow-hidden shadow-sm bg-[#fafafa]">

          {/* Messages */}
          <div ref={messagesRef} className="h-[480px] overflow-y-auto p-6 space-y-6">
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} isLast={i === messages.length - 1} loading={loading} />
            ))}

            {/* Typing indicator: show only when loading and last message is empty assistant msg */}
            {loading && messages[messages.length - 1]?.content === '' && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-white border border-[#d6d6d6] rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
                  <span className="w-2 h-2 bg-[#616161] rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-[#616161] rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-[#616161] rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}

          </div>

          {/* Divider */}
          <div className="border-t border-[#d6d6d6] bg-white">
            {/* Input area */}
            <div className="p-4 flex gap-3 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Stel uw vraag hier… (Enter om te sturen, Shift+Enter voor nieuwe lijn)"
                disabled={loading}
                rows={2}
                className="flex-1 resize-none rounded-lg border border-[#d6d6d6] bg-[#f9f9f9] px-4 py-3 text-sm text-[#494949] placeholder:text-[#868686] focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600 disabled:opacity-50 leading-relaxed"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="h-11 w-11 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shrink-0"
                aria-label="Versturen"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <p className="px-4 pb-3 text-xs text-[#868686]">
              Enter = versturen · Shift+Enter = nieuwe lijn
            </p>
          </div>
        </div>

        {/* Auth info bar */}
        {!isAuthenticated && (
          <p className="mt-4 text-xs text-center text-[#868686]">
            <a href="/login" className="text-brand-600 hover:underline font-medium">Meld u aan</a> om uw gesprekhistoriek bij te houden over meerdere sessies.
          </p>
        )}
      </div>
    </section>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: ChatMessage;
  isLast: boolean;
  loading: boolean;
}

function MessageBubble({ message, isLast, loading }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isStreaming = isLast && loading && !isUser && message.content !== '';

  if (!message.content && !isUser) return null; // hide empty placeholder (typing indicator shown separately)

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
        isUser ? 'bg-brand-600' : 'bg-[#494949]'
      }`}>
        {isUser
          ? <User className="h-4 w-4 text-white" />
          : <Bot className="h-4 w-4 text-white" />
        }
      </div>

      {/* Bubble */}
      {isUser ? (
        <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap bg-brand-600 text-white rounded-tr-sm`}>
          {message.content}
        </div>
      ) : (
        <div className={`chat-prose max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-white border border-[#d6d6d6] text-[#494949] rounded-tl-sm ${isStreaming ? 'streaming-cursor' : ''}`}>
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
