'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Car, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('De wachtwoorden komen niet overeen.');
      return;
    }
    if (password.length < 8) {
      setError('Wachtwoord moet minimaal 8 tekens bevatten.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registratie mislukt.');
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Er is een fout opgetreden. Probeer opnieuw.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 flex items-center justify-center px-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center mx-auto mb-3">
            <Car className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-xl">Account aanmaken</CardTitle>
          <CardDescription>PeterAllesweter — Registreren</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Volledige naam</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Jan Janssen"
                required
                autoComplete="name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mailadres</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jan@voorbeeld.be"
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
                placeholder="Minimaal 8 tekens"
                required
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Wachtwoord bevestigen</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Herhaal wachtwoord"
                required
                autoComplete="new-password"
              />
            </div>

            {/* Password strength hints */}
            <ul className="text-xs space-y-1 text-[#616161]">
              <li className={`flex items-center gap-1.5 ${password.length >= 8 ? 'text-brand-600' : ''}`}>
                <CheckCircle2 className={`h-3.5 w-3.5 ${password.length >= 8 ? 'text-brand-600' : 'text-[#d6d6d6]'}`} />
                Minimaal 8 tekens
              </li>
              <li className={`flex items-center gap-1.5 ${confirm && confirm === password ? 'text-brand-600' : ''}`}>
                <CheckCircle2 className={`h-3.5 w-3.5 ${confirm && confirm === password ? 'text-brand-600' : 'text-[#d6d6d6]'}`} />
                Wachtwoorden komen overeen
              </li>
            </ul>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Account aanmaken
            </Button>
          </form>

          <p className="text-center text-sm text-[#616161] mt-5">
            Al een account?{' '}
            <Link href="/login" className="text-brand-600 hover:underline font-medium">
              Inloggen
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
