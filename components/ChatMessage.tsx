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
