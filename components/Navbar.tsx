import React from 'react';
import { getUser } from '@/lib/auth';
import NavbarClient from '@/components/NavbarClient';

export default async function Navbar() {
  const user = await getUser();
  return <NavbarClient isAuthenticated={!!user} userEmail={user?.email} isAdmin={user?.role === 'admin'} />;
}
