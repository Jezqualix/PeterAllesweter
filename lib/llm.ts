import { Vehicle, ChatMessage } from '@/types';

export function buildSystemPrompt(vehicles: Vehicle[]): string {
  // Only include available vehicles to keep the prompt compact
  const available = vehicles.filter(v => v.availabilityStatus === 'available');

  // Compact single-line format per vehicle to stay within context window
  const vehicleList = available.map(v => {
    const prices = [
      v.halfDayPrice  ? `½dag €${v.halfDayPrice}`   : null,
      v.fullDayPrice  ? `dag €${v.fullDayPrice}`     : null,
      v.weekendPrice  ? `weekend €${v.weekendPrice}` : null,
      v.weekPrice     ? `week €${v.weekPrice}`       : null,
      v.monthPrice    ? `maand €${v.monthPrice}`     : null,
    ].filter(Boolean).join(', ');
    return `• ${v.year} ${v.brand} ${v.model} | ${v.type} | ${v.seats}pl | ${v.transmissionType} | ${v.engineTypeName || v.fuelType || ''} | ${prices || 'prijs op aanvraag'} | ${v.locationCity || ''}`;
  }).join('\n');

  return `Je bent een klantenservice-assistent voor PeterAllesweter autoverhuur (België). Antwoord in het Nederlands. Wees vriendelijk en bondig.

Je kan klanten helpen met: voertuigen zoeken, prijzen en beschikbaarheid, reserveringen.
Bij een reservering: vraag naar gewenste periode en voertuig.
Gebruik ALTIJD de prijzen uit de voertuigenlijst hieronder. Bereken nooit zelf een prijs op basis van dagprijs × aantal dagen — elk huurtype heeft een vaste prijs.

OPMAAK: Gebruik Markdown voor leesbaarheid.
- Splits lange antwoorden op in korte paragrafen (max 3 zinnen per paragraaf).
- Gebruik **vet** voor voertuignamen, prijzen en belangrijke termen.
- Gebruik tabellen wanneer je meerdere voertuigen of tarieven vergelijkt (kolommen: Voertuig | Type | Transmissie | Prijs).
- Gebruik een opsomming (- item) voor lijsten van kenmerken of opties.
- Gebruik geen codeblokken of HTML.

BESCHIKBARE VOERTUIGEN (${available.length} van ${vehicles.length}):
${vehicleList || 'Geen voertuigen beschikbaar.'}

Contact: ${process.env.CONTACT_EMAIL || 'info@peterallesweter.be'}`;
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
