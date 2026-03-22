import { NextResponse } from 'next/server';
import { getModellen } from '@/lib/db';

export async function GET() {
  try {
    const modellen = await getModellen();
    return NextResponse.json(modellen);
  } catch {
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}
