'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, Car, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavbarClientProps {
  isAuthenticated: boolean;
  userEmail?: string;
  isAdmin: boolean;
}

export default function NavbarClient({ isAuthenticated, userEmail, isAdmin }: NavbarClientProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.refresh();
  }

  return (
    <nav className="bg-brand-600 shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl hover:opacity-90 transition-opacity">
            <Car className="h-6 w-6 text-accent" />
            <span>PeterAllesweter</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#voertuigen" className="text-white/90 hover:text-white text-sm font-medium transition-colors">
              Voertuigen
            </a>
            <a href="#chat" className="text-white/90 hover:text-white text-sm font-medium transition-colors">
              Assistent
            </a>
            <a href="#contact" className="text-white/90 hover:text-white text-sm font-medium transition-colors">
              Contact
            </a>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link href="/admin">
                    <Button variant="cta" size="sm" className="gap-1.5">
                      <Shield className="h-3.5 w-3.5" />
                      Admin
                    </Button>
                  </Link>
                )}
                <span className="text-white/70 text-xs max-w-[140px] truncate">{userEmail}</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm transition-colors"
                  title="Uitloggen"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="cta" size="sm">
                  Inloggen
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-brand-700 px-4 pb-4 pt-2 flex flex-col gap-3">
          <a href="#voertuigen" className="text-white text-sm font-medium py-2" onClick={() => setMenuOpen(false)}>
            Voertuigen
          </a>
          <a href="#chat" className="text-white text-sm font-medium py-2" onClick={() => setMenuOpen(false)}>
            Assistent
          </a>
          <a href="#contact" className="text-white text-sm font-medium py-2" onClick={() => setMenuOpen(false)}>
            Contact
          </a>
          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Link href="/admin" onClick={() => setMenuOpen(false)}>
                  <Button variant="cta" size="sm" className="w-full gap-1.5">
                    <Shield className="h-3.5 w-3.5" /> Admin
                  </Button>
                </Link>
              )}
              <button onClick={handleLogout} className="flex items-center gap-2 text-white/80 text-sm py-2">
                <LogOut className="h-4 w-4" /> Uitloggen ({userEmail})
              </button>
            </>
          ) : (
            <Link href="/login" onClick={() => setMenuOpen(false)}>
              <Button variant="cta" size="sm" className="w-full">Inloggen</Button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
