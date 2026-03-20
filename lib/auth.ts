import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { AuthUser } from '@/types';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'peterallesweter-super-secret-jwt-key-change-in-production-2026'
);

export async function signToken(user: AuthUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<AuthUser> {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as AuthUser;
}

export async function getUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}

export function checkAdminCredentials(email: string, password: string): boolean {
  return (
    email === (process.env.ADMIN_EMAIL || 'admin@peterallesweter.be') &&
    password === (process.env.ADMIN_PASSWORD || 'Admin2026!')
  );
}

export function checkDemoCredentials(email: string, password: string): boolean {
  return (
    email === (process.env.DEMO_USER_EMAIL || 'demo@peterallesweter.be') &&
    password === (process.env.DEMO_USER_PASSWORD || 'Demo2026!')
  );
}
