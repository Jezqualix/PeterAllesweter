import { Vehicle, RentalLocation, ChatMessage } from '@/types';

export function buildSystemPrompt(vehicles: Vehicle[], locations: RentalLocation[] = []): string {
  const available = vehicles.filter(v => v.isAvailable);

  // Group by brand+model to keep the prompt compact (fleet can be 1000+ vehicles)
  type ModelGroup = {
    type: string; seats: number | null; engineCC: number | null;
    cities: Set<string>; count: number;
    halfDayPrice?: number | null; fullDayPrice?: number | null;
    weekPrice?: number | null; monthPrice?: number | null;
  };
  const grouped = new Map<string, ModelGroup>();

  for (const v of available) {
    const key = `${v.brand}|${v.model}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        type: v.type, seats: v.seats, engineCC: v.engineCC, cities: new Set(), count: 0,
        halfDayPrice: v.halfDayPrice, fullDayPrice: v.fullDayPrice,
        weekPrice: v.weekPrice, monthPrice: v.monthPrice,
      });
    }
    const g = grouped.get(key)!;
    g.count++;
    if (v.locationCity) g.cities.add(v.locationCity);
  }

  const fleetList = Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, g]) => {
      const [brand, model] = key.split('|');
      const specs = [
        g.seats ? `${g.seats}pl` : null,
        g.engineCC ? `${g.engineCC}cc` : null,
      ].filter(Boolean).join(', ');
      const cities = Array.from(g.cities).slice(0, 4).join(', ');
      const prices = [
        g.halfDayPrice ? `½dag €${g.halfDayPrice}` : null,
        g.fullDayPrice ? `dag €${g.fullDayPrice}` : null,
        g.weekPrice    ? `week €${g.weekPrice}`    : null,
        g.monthPrice   ? `maand €${g.monthPrice}`  : null,
      ].filter(Boolean).join(', ');
      return `• ${brand} ${model} | ${g.type} | ${specs} | ${prices || 'prijs op aanvraag'} | ${g.count}x | ${cities}`;
    }).join('\n');

  return `Je bent een klantenservice-assistent voor PeterAllesweter autoverhuur (België). Antwoord in het Nederlands. Wees vriendelijk en bondig.

Gebruik markdown-opmaak in je antwoorden: **vetgedrukt** voor labels en belangrijke waarden, - opsommingstekens voor meerdere opties of voertuigen. Gebruik geen koppen (#) of code-blokken.

Je kan klanten helpen met: voertuigen zoeken, prijzen, beschikbaarheid en reserveringen.
Gebruik ALTIJD de prijzen uit de lijst hieronder. Bereken nooit zelf een prijs op basis van dagprijs × aantal dagen — elk huurtype heeft een vaste prijs.
Voor verhuur langer dan één maand: zeg dat de prijs op aanvraag is en verwijs naar contact.
Voertuigtypes in onze vloot: "Motor" = motor/motorfiets. Als een klant vraagt naar motoren, toon enkel voertuigen met type "Motor".
Als een klant vraagt naar een type dat niet in de lijst staat (bv. campers), zeg dan eerlijk dat we dat niet verhuren.

ONZE VLOOT (${grouped.size} modellen, ${available.length} voertuigen beschikbaar):
${fleetList || 'Geen voertuigen beschikbaar.'}

VESTIGINGEN (${locations.length}):
${locations.map(l => `• ${l.name} | ${l.address}, ${l.city} | tel: ${l.phone}${l.email ? ` | e-mail: ${l.email}` : ''}${l.verantwoordelijke ? ` | verantwoordelijke: ${l.verantwoordelijke}` : ''}`).join('\n') || 'Geen vestigingen beschikbaar.'}

Als je een vraag niet kan beantwoorden op basis van bovenstaande gegevens, verwijs de klant dan vriendelijk door: "Voor meer informatie kan u ons bereiken via **peterallesweter@dockx.be**."

Contact: ${process.env.CONTACT_EMAIL || 'peterallesweter@dockx.be'}`;
}

export async function streamChat(
  messages: ChatMessage[],
  onChunk: (text: string) => void
): Promise<void> {
  const llmUrl = process.env.LLM_URL || 'http://localhost:1234/v1/chat/completions';
  const timeout = parseInt(process.env.LLM_TIMEOUT || '30000');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(llmUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || 'local-model',
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 1024,
      }),
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`LLM API error: ${response.status} — ${errText.slice(0, 200)}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body from LLM');

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const raw = decoder.decode(value, { stream: true });
      const lines = raw.split('\n');

      for (const line of lines) {
        // Detect LM Studio / Ollama error events
        if (line.startsWith('event: error')) continue;

        if (!line.startsWith('data: ')) continue;

        const data = line.slice(6).trim();
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);

          // Surface LLM-level errors (e.g. context overflow)
          if (parsed.error) {
            throw new Error(parsed.error.message || 'LLM error');
          }

          const text = parsed.choices?.[0]?.delta?.content;
          if (text) onChunk(text);
        } catch (e) {
          // Re-throw real errors, ignore JSON parse failures on malformed chunks
          if (e instanceof Error && e.message !== 'LLM error' && !e.message.startsWith('LLM')) {
            continue; // malformed JSON chunk, skip
          }
          throw e;
        }
      }
    }
  } finally {
    clearTimeout(timeoutId);
  }
}
