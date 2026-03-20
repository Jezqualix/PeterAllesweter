import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUser } from '@/lib/auth';
import { getUsers, createUser } from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || undefined;
  const role   = searchParams.get('role')   || undefined;

  const users = await getUsers({ search, role });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { name, email, password, role } = body;

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: 'Naam, email, wachtwoord en rol zijn verplicht' }, { status: 400 });
  }
  if (!['admin', 'user'].includes(role)) {
    return NextResponse.json({ error: 'Ongeldige rol' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const id = await createUser({ name, email, passwordHash, role });
    return NextResponse.json({ id }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('UNIQUE') || msg.includes('duplicate')) {
      return NextResponse.json({ error: 'Email is al in gebruik' }, { status: 409 });
    }
    throw err;
  }
}
