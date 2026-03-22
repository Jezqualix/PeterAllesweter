import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByEmail, createUser } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'Naam, e-mail en wachtwoord zijn verplicht.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Wachtwoord moet minimaal 8 tekens bevatten.' }, { status: 400 });
    }

    const existing = await getUserByEmail(email.trim().toLowerCase());
    if (existing) {
      return NextResponse.json({ error: 'Dit e-mailadres is al in gebruik.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const id = await createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: 'user',
    });

    const token = await signToken({ id: String(id), email: email.trim().toLowerCase(), role: 'user' });

    const response = NextResponse.json({ success: true });
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Interne serverfout.' }, { status: 500 });
  }
}
