import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signToken, checkAdminCredentials, checkDemoCredentials } from '@/lib/auth';
import { getUserByEmail } from '@/lib/db';
import { AuthUser } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail en wachtwoord zijn verplicht' }, { status: 400 });
    }

    let user: AuthUser | null = null;

    // 1. Check legacy env-var credentials
    if (checkAdminCredentials(email, password)) {
      user = { id: 'admin', email, role: 'admin' };
    } else if (checkDemoCredentials(email, password)) {
      user = { id: 'demo', email, role: 'user' };
    }

    // 2. Fallback: check AdminUsers table
    if (!user) {
      const dbUser = await getUserByEmail(email);
      if (dbUser && dbUser.isActive && await bcrypt.compare(password, dbUser.passwordHash)) {
        user = { id: String(dbUser.id), email: dbUser.email, role: dbUser.role };
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Onjuiste inloggegevens' }, { status: 401 });
    }

    const token = await signToken(user);

    const response = NextResponse.json({ success: true, user: { email: user.email, role: user.role } });
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('auth-token');
  return response;
}
