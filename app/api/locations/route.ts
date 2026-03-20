import { NextResponse } from 'next/server';
import { getRentalLocations } from '@/lib/db';

export async function GET() {
  try {
    const locations = await getRentalLocations();
    return NextResponse.json(locations);
  } catch {
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}
