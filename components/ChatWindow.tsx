'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ChatMessage from '@/components/ChatMessage';
import { ChatMessage as ChatMessageType } from '@/types';

const WELCOME_MESSAGE: ChatMessageType = {
  role: 'assistant',
  content: 'Goedag! Ik ben de virtuele assistent van PeterAllesweter. Hoe kan ik u helpen met uw autoverhuur vandaag? 🚗',
};

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('pa-session-id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('pa-session-id', id);
  }
  return id;
}

export default function ChatWindow() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageType[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(getOrCreateSessionId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen for open-chat events from VehicleGrid
  useEffect(() => {
    function handleOpenChat(e: Event) {
      const detail = (e as CustomEvent<{ message: string }>).detail;
      setOpen(true);
      setInput(detail.message);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
    window.addEventListener('open-chat', handleOpenChat);
    return () => window.removeEventListener('open-chat', handleOpenChat);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessageType = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const assistantMsg: ChatMessageType = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId }),
      });

      if (!response.ok) throw new Error('Chat request failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          const raw = line.slice(6);
          if (raw === '[DONE]') break;
          let text: string;
          try {
            text = JSON.parse(raw);
          } catch {
            text = raw; // fallback for non-JSON chunks
          }
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: updated[updated.length - 1].content + text,
            };
            return updated;
          });
        }
      }
    } catch (_err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: 'Sorry, er is een fout opgetreden. Probeer het opnieuw.',
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }, [input, loading, sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700 transition-colors flex items-center justify-center"
        aria-label="Chat openen"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 flex flex-col rounded-xl shadow-2xl border border-[#d6d6d6] overflow-hidden bg-white">
          {/* Header */}
          <div className="bg-brand-600 px-4 py-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center">
              <Car className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">PeterAllesweter</p>
              <p className="text-white/70 text-xs">Virtuele assistent</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80 bg-white">
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}

            {/* Typing indicator */}
            {loading && messages[messages.length - 1]?.content === '' && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center shrink-0">
                  <Car className="h-4 w-4 text-white" />
                </div>
                <div className="bg-[#f3f3f3] border border-[#d6d6d6] rounded-2xl rounded-tl-sm px-3 py-2 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-[#616161] rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-[#616161] rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-[#616161] rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[#d6d6d6] p-3 flex gap-2 bg-white">
            <Input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Stel uw vraag..."
              disabled={loading}
              className="flex-1 text-sm"
            />
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              aria-label="Versturen"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
