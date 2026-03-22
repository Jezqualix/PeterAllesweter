import React from 'react';
import Navbar from '@/components/Navbar';
import { getVehicles, getRentalLocations, getModellen } from '@/lib/db';
import {
  Car, MapPin, Search, Calendar, HelpCircle,
  MessageSquare, Bike, Truck, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Wat kan u vragen? — PeterAllesweter',
  description: 'Ontdek welke vragen u aan de PeterAllesweter chatbot kan stellen over ons wagenpark, beschikbaarheid en locaties.',
};

export default async function ChatbotInfoPage() {
  const [vehicles, locations, modellen] = await Promise.all([
    getVehicles().catch(() => []),
    getRentalLocations().catch(() => []),
    getModellen().catch(() => []),
  ]);

  const beschikbaar = vehicles.filter(v => v.isAvailable).length;

  // Group by type
  const byType = vehicles.reduce<Record<string, number>>((acc, v) => {
    const t = v.type || 'Overig';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  // Unique brands
  const merken = [...new Set(vehicles.map(v => v.brand).filter(Boolean))].sort();

  // Unique cities from locations
  const steden = [...new Set(locations.map(l => l.city).filter(Boolean))].sort();

  const typeIcon = (type: string) => {
    if (type === 'Motor')       return <Bike className="h-5 w-5" />;
    if (type === 'Bestelwagen') return <Truck className="h-5 w-5" />;
    if (type === 'Aanhangwagen')return <Truck className="h-5 w-5" />;
    return <Car className="h-5 w-5" />;
  };

  const voorbeeldVragen = [
    {
      categorie: 'Voertuigen zoeken',
      icon: <Search className="h-5 w-5 text-brand-600" />,
      vragen: [
        'Welke auto\'s hebben jullie beschikbaar?',
        'Toon me alle SUV\'s in Gent.',
        'Hebben jullie motors te huur?',
        'Ik zoek een bestelwagen voor een verhuizing.',
        'Welke voertuigen zijn beschikbaar in Antwerpen?',
        'Hoeveel zitplaatsen heeft de Toyota Corolla?',
      ],
    },
    {
      categorie: 'Beschikbaarheid',
      icon: <Calendar className="h-5 w-5 text-brand-600" />,
      vragen: [
        'Is de BMW 3 Serie beschikbaar volgende week?',
        'Ik wil een auto huren van 1 tot 5 april.',
        'Welke voertuigen zijn vrij in het weekend?',
        'Is er een bestelwagen beschikbaar in Brussel?',
      ],
    },
    {
      categorie: 'Locaties & vestigingen',
      icon: <MapPin className="h-5 w-5 text-brand-600" />,
      vragen: [
        'Waar zijn jullie vestigingen?',
        'Hebben jullie een kantoor in Leuven?',
        'Wat is het adres van de vestiging in Brugge?',
        'In welke steden kan ik een voertuig ophalen?',
      ],
    },
    {
      categorie: 'Prijzen & reserveren',
      icon: <MessageSquare className="h-5 w-5 text-brand-600" />,
      vragen: [
        'Wat kost het om een auto te huren?',
        'Ik wil de Volkswagen Golf reserveren.',
        'Hoe kan ik een voertuig reserveren?',
        'Kan ik een offerte krijgen voor een weekverhuur?',
      ],
    },
    {
      categorie: 'Algemene info',
      icon: <HelpCircle className="h-5 w-5 text-brand-600" />,
      vragen: [
        'Welke merken hebben jullie in de vloot?',
        'Verhuren jullie ook aanhangwagens?',
        'Wat zijn jullie contactgegevens?',
        'Hoe werkt het verhuurproces?',
      ],
    },
  ];

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-4">
            <MessageSquare className="h-4 w-4 text-accent" />
            <span>Intelligente chatassistent</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Wat kan u aan onze chatbot vragen?
          </h1>
          <p className="text-white/75 text-base max-w-xl mx-auto">
            Onze chatbot heeft toegang tot realtime gegevens over ons volledige wagenpark.
            Hieronder vindt u een overzicht van wat u allemaal kan opvragen.
          </p>
        </div>
      </section>

      {/* Fleet stats */}
      <section className="bg-white border-b border-[#d6d6d6] py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#616161] mb-5 text-center">
            Live beschikbare gegevens
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-xl bg-[#f3f3f3]">
              <p className="text-3xl font-bold text-brand-600">{beschikbaar}</p>
              <p className="text-sm text-[#616161] mt-1">Voertuigen beschikbaar</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-[#f3f3f3]">
              <p className="text-3xl font-bold text-brand-600">{vehicles.length}</p>
              <p className="text-sm text-[#616161] mt-1">Voertuigen in totaal</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-[#f3f3f3]">
              <p className="text-3xl font-bold text-brand-600">{locations.length}</p>
              <p className="text-sm text-[#616161] mt-1">Vestigingen</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-[#f3f3f3]">
              <p className="text-3xl font-bold text-brand-600">{merken.length}</p>
              <p className="text-sm text-[#616161] mt-1">Merken</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">

        {/* Vehicle types */}
        <section>
          <h2 className="text-xl font-bold text-[#494949] mb-4">Voertuigtypes in onze vloot</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(byType).sort(([,a],[,b]) => b - a).map(([type, count]) => (
              <div key={type} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[#d6d6d6]">
                <span className="text-brand-600">{typeIcon(type)}</span>
                <div>
                  <p className="font-semibold text-[#494949] text-sm">{type}</p>
                  <p className="text-xs text-[#616161]">{count} voertuigen</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Brands */}
        <section>
          <h2 className="text-xl font-bold text-[#494949] mb-4">Beschikbare merken</h2>
          <div className="flex flex-wrap gap-2">
            {merken.map(merk => (
              <span key={merk} className="px-3 py-1.5 bg-white border border-[#d6d6d6] rounded-full text-sm text-[#494949]">
                {merk}
              </span>
            ))}
          </div>
        </section>

        {/* Locations */}
        <section>
          <h2 className="text-xl font-bold text-[#494949] mb-4">Vestigingen</h2>
          <div className="flex flex-wrap gap-2">
            {steden.map(stad => (
              <span key={stad} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#d6d6d6] rounded-full text-sm text-[#494949]">
                <MapPin className="h-3.5 w-3.5 text-brand-600" />
                {stad}
              </span>
            ))}
          </div>
        </section>

        {/* Pricing table */}
        <section>
          <h2 className="text-xl font-bold text-[#494949] mb-2">Tarieven per voertuigmodel</h2>
          <p className="text-sm text-[#616161] mb-5">
            Vaste prijzen per huurperiode — voor verhuur langer dan één maand geldt prijs op aanvraag.
          </p>
          <div className="bg-white rounded-xl border border-[#d6d6d6] overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f3f3f3] border-b border-[#d6d6d6]">
                <tr>
                  <th className="text-left px-4 py-3 text-[#616161] font-medium">Model</th>
                  <th className="text-left px-4 py-3 text-[#616161] font-medium">Type</th>
                  <th className="text-right px-4 py-3 text-[#616161] font-medium">½ dag</th>
                  <th className="text-right px-4 py-3 text-[#616161] font-medium">Dag</th>
                  <th className="text-right px-4 py-3 text-[#616161] font-medium">Week</th>
                  <th className="text-right px-4 py-3 text-[#616161] font-medium">Maand</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d6d6d6]">
                {modellen.map(m => (
                  <tr key={m.id} className="hover:bg-[#f9f9f9]">
                    <td className="px-4 py-3 font-medium text-[#494949]">
                      {m.merk} {m.modelNaam}
                      {m.motorInhoud ? <span className="text-xs text-[#616161] ml-1.5">{m.motorInhoud}cc</span> : null}
                    </td>
                    <td className="px-4 py-3 text-[#616161]">{m.type}</td>
                    <td className="px-4 py-3 text-right text-[#494949]">
                      {m.halfDagPrijs ? `€${Number(m.halfDagPrijs).toFixed(2)}` : <span className="text-[#616161] italic text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-[#494949]">
                      {m.dagPrijs ? `€${Number(m.dagPrijs).toFixed(2)}` : <span className="text-[#616161] italic text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-600">
                      {m.weekPrijs ? `€${Number(m.weekPrijs).toFixed(2)}` : <span className="text-[#616161] italic text-xs font-normal">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-600">
                      {m.maandPrijs ? `€${Number(m.maandPrijs).toFixed(2)}` : <span className="text-[#616161] italic text-xs font-normal">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[#f9f9f9] border-t border-[#d6d6d6]">
                <tr>
                  <td colSpan={2} className="px-4 py-2.5 text-xs text-[#616161]">Langer dan 1 maand</td>
                  <td colSpan={4} className="px-4 py-2.5 text-right text-xs text-[#616161] italic">Prijs op aanvraag — neem contact op</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Example questions */}
        <section>
          <h2 className="text-xl font-bold text-[#494949] mb-6">Voorbeeldvragen per onderwerp</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {voorbeeldVragen.map(cat => (
              <div key={cat.categorie} className="bg-white rounded-xl border border-[#d6d6d6] p-5">
                <div className="flex items-center gap-2 mb-4">
                  {cat.icon}
                  <h3 className="font-semibold text-[#494949]">{cat.categorie}</h3>
                </div>
                <ul className="space-y-2">
                  {cat.vragen.map(vraag => (
                    <li key={vraag} className="flex items-start gap-2 text-sm text-[#616161]">
                      <ChevronRight className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
                      <span>&ldquo;{vraag}&rdquo;</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-6">
          <p className="text-[#616161] mb-4">Klaar om te starten? Stel uw vraag direct op de homepage.</p>
          <Link
            href="/#chat"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            Naar de chatbot
          </Link>
        </section>

      </div>

      <footer className="bg-brand-900 text-white/50 text-xs text-center py-6 px-4">
        © {new Date().getFullYear()} PeterAllesweter. Alle rechten voorbehouden.
      </footer>
    </>
  );
}
