import { NextRequest, NextResponse } from 'next/server';
import { getAllConversations, getMessages } from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id'); // conversationId string

    if (id) {
      const messages = await getMessages(id);
      return NextResponse.json(messages);
    }

    const conversations = await getAllConversations();
    return NextResponse.json(conversations);
  } catch {
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}
