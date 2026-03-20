import { NextResponse } from 'next/server';
import { getEngineTypes } from '@/lib/db';

export async function GET() {
  try {
    const engineTypes = await getEngineTypes();
    return NextResponse.json(engineTypes);
  } catch {
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}
