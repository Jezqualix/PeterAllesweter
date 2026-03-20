import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUser } from '@/lib/auth';
import { getUserById, updateUser, deleteUser } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const adminUser = await getUserById(Number(id));
  if (!adminUser) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
  return NextResponse.json(adminUser);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, email, password, role, isActive, forcePasswordReset } = body;

  const updateData: Parameters<typeof updateUser>[1] = {};
  if (name             !== undefined) updateData.name               = name;
  if (email            !== undefined) updateData.email              = email;
  if (role             !== undefined) updateData.role               = role;
  if (isActive         !== undefined) updateData.isActive           = isActive;
  if (forcePasswordReset !== undefined) updateData.forcePasswordReset = forcePasswordReset;
  if (password) {
    updateData.passwordHash = await bcrypt.hash(password, 10);
  }

  try {
    await updateUser(Number(id), updateData);
    const updated = await getUserById(Number(id));
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('UNIQUE') || msg.includes('duplicate')) {
      return NextResponse.json({ error: 'Email is al in gebruik' }, { status: 409 });
    }
    throw err;
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  await deleteUser(Number(id));
  return NextResponse.json({ ok: true });
}
