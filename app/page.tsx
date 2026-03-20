import React from 'react';
import Navbar from '@/components/Navbar';
import VehicleGrid from '@/components/VehicleGrid';
import ChatSection from '@/components/ChatSection';
import { getVehicles } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { Vehicle } from '@/types';
import { MapPin, Phone, Mail, ChevronDown } from 'lucide-react';

async function fetchVehicles(): Promise<Vehicle[]> {
  try {
    return await getVehicles();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [vehicles, user] = await Promise.all([fetchVehicles(), getUser()]);

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-accent text-brand-900 text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
            Autoverhuur in België
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
            Uw perfecte rijervaring<br />begint hier
          </h1>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Van stadsrit tot weekendgetaway — wij hebben het voertuig dat bij u past.
            Met 10 vestigingen door heel België, altijd in de buurt.
          </p>
          <a href="#voertuigen" className="btn-cta inline-flex items-center gap-2">
            Bekijk onze voertuigen
            <ChevronDown className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Embedded chat — centered, full-width, not a popup */}
      <ChatSection
        isAuthenticated={!!user}
        userEmail={user?.email}
      />

      {/* Vehicles */}
      <section id="voertuigen" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#494949] mb-2">Onze vloot</h2>
            <p className="text-[#616161]">
              {vehicles.length} voertuigen beschikbaar op{' '}
              {new Date().toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {vehicles.length === 0 ? (
            <div className="text-center py-16 text-[#616161]">
              <p className="text-lg">Momenteel geen voertuigen beschikbaar.</p>
              <p className="text-sm mt-2">Neem contact op voor meer informatie.</p>
            </div>
          ) : (
            <VehicleGrid vehicles={vehicles} />
          )}
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-brand-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-3 text-accent">PeterAllesweter</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              Professionele autoverhuur in België.<br />
              Meer dan 10 vestigingen door heel het land.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-3 text-white/60">Contact</h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-accent" />
                <a href={`mailto:${process.env.CONTACT_EMAIL || 'info@peterallesweter.be'}`} className="hover:text-white">
                  {process.env.CONTACT_EMAIL || 'info@peterallesweter.be'}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-accent" />
                <span>+32 (0)2 123 45 67</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-3 text-white/60">Vestigingen</h3>
            <ul className="space-y-1 text-sm text-white/80">
              {['Antwerpen','Brussel','Gent','Brugge','Leuven','Mechelen','Hasselt','Liège','Namen','Kortrijk'].map(city => (
                <li key={city} className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-accent shrink-0" />
                  {city}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/10 text-center text-white/40 text-xs">
          © {new Date().getFullYear()} PeterAllesweter. Alle rechten voorbehouden.
        </div>
      </footer>
    </>
  );
}
