import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PeterAllesweter — Autoverhuur',
  description: 'Professionele autoverhuur in België. Ontdek ons uitgebreide wagenpark voor elke gelegenheid.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
