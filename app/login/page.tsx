'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Car, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Inloggen mislukt');
        return;
      }

      // Non-admin users cannot access /admin — send them to the homepage
      const destination = data.user?.role === 'admin' ? redirect : '/';
      router.push(destination);
    } catch {
      setError('Er is een fout opgetreden. Probeer opnieuw.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mailadres</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="admin@peterallesweter.be"
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Wachtwoord</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Inloggen
      </Button>

      <p className="text-center text-sm text-[#616161] mt-5">
        Nog geen account?{' '}
        <Link href="/register" className="text-brand-600 hover:underline font-medium">
          Registreren
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 flex items-center justify-center px-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center mx-auto mb-3">
            <Car className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-xl">Inloggen</CardTitle>
          <CardDescription>PeterAllesweter</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-40 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-600" /></div>}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
