import { NextRequest } from 'next/server';
import {
  getConversationByUser,
  createConversation,
  getMessages,
  saveMessage,
  getVehicles,
  getRentalLocations,
} from '@/lib/db';
import { buildSystemPrompt, streamChat } from '@/lib/llm';
import { rateLimit } from '@/lib/rateLimit';
import { getUser } from '@/lib/auth';
import { ChatMessage, Message } from '@/types';

/**
 * Truncate message history to stay within maxChars total content.
 * Always keeps the most recent messages.
 */
function truncateHistory(messages: Message[], maxChars: number): ChatMessage[] {
  const result: ChatMessage[] = [];
  let total = 0;

  // Walk backwards (newest first), then reverse
  for (let i = messages.length - 1; i >= 0; i--) {
    const len = messages[i].content.length;
    if (total + len > maxChars) break;
    result.unshift({ role: messages[i].role as 'user' | 'assistant', content: messages[i].content });
    total += len;
  }

  return result;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { allowed } = rateLimit(ip);
  if (!allowed) return new Response('Too Many Requests', { status: 429 });

  try {
    const { message, sessionId } = await request.json();
    if (!message || !sessionId) return new Response('Missing message or sessionId', { status: 400 });

    // Determine identity: authenticated users get persistent history, guests get fresh session
    const authUser = await getUser();
    const isAuthenticated = !!authUser;

    // For authenticated users: use their user ID so history persists across sessions
    // For guests: use the per-page-load sessionId (no localStorage, resets on refresh)
    const userId = isAuthenticated ? (authUser!.id || authUser!.email || 'auth-user') : sessionId;

    let conversationId: string;

    if (isAuthenticated) {
      // Authenticated: resume latest conversation or create new one
      const existing = await getConversationByUser(userId);
      conversationId = existing ? existing.conversationId : await createConversation(userId);
    } else {
      // Guest: sessionId is ephemeral (generated per page load, not persisted)
      // Always create a fresh conversation per session
      const existing = await getConversationByUser(userId);
      conversationId = existing ? existing.conversationId : await createConversation(userId);
    }

    // Fetch history BEFORE saving new user message
    const rawHistory = await getMessages(conversationId);

    // Authenticated: keep last 3000 chars of history; Guest: no history (fresh context)
    const history = isAuthenticated ? truncateHistory(rawHistory, 3000) : [];

    // Save user message
    await saveMessage(conversationId, 'user', message);

    // Build LLM context
    const [vehicles, locations] = await Promise.all([getVehicles(), getRentalLocations()]);
    const systemPrompt = buildSystemPrompt(vehicles, locations);
    const modelName = process.env.LLM_MODEL || 'local-model';

    const llmMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message },
    ];

    const encoder = new TextEncoder();
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          await streamChat(llmMessages, (chunk) => {
            fullResponse += chunk;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          });

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();

          await saveMessage(conversationId, 'assistant', fullResponse, modelName);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'LLM fout';
          controller.enqueue(encoder.encode(`data: Sorry, er is een fout opgetreden: ${errMsg}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[chat] route error:', msg);
    return new Response(`Interne serverfout: ${msg}`, { status: 500 });
  }
}
