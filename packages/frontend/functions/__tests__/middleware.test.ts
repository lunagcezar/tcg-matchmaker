import { describe, it, expect } from 'vitest';

// Replicate the exact functions from _middleware.ts for testing
const CRAWLER_PATTERNS = [
  /Googlebot/i, /Bingbot/i, /Slurp/i, /DuckDuckBot/i,
  /Baiduspider/i, /YandexBot/i, /facebookexternalhit/i,
  /Twitterbot/i, /LinkedInBot/i, /WhatsApp/i,
  /Applebot/i, /SemrushBot/i, /PetalBot/i,
  /AwarioSmartBot/i, /SeekportBot/i, /DotBot/i,
];

function isCrawler(userAgent: string): boolean {
  return CRAWLER_PATTERNS.some((p) => p.test(userAgent));
}

function detailMatch(pathname: string): RegExpMatchArray | null {
  return pathname.match(/^\/(matches|trading|tournaments)\/([a-f0-9-]+)$/i);
}

function storeMatch(pathname: string): RegExpMatchArray | null {
  return pathname.match(/^\/stores\/([a-f0-9-]+)$/i);
}

function profileMatch(pathname: string): RegExpMatchArray | null {
  return pathname.match(/^\/profile\/([a-zA-Z0-9_-]+)$/i);
}

function eventJsonLd(event: Record<string, unknown>): string {
  const startDate = (event.scheduled_at as string) || '';
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: (event.name as string) || `${event.type} Event`,
    description: (event.description as string) || '',
    startDate,
    location: {
      '@type': 'Place',
      name: (event.custom_location_name as string) || undefined,
      address: { '@type': 'PostalAddress', addressLocality: (event.city as string) || 'Fortaleza' },
    },
  });
}

function htmlShell(title: string, description: string, url: string, type: string, jsonld: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title} | TCG Matchmaker</title>
<meta name="description" content="${description}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:url" content="${url}" />
<meta property="og:type" content="${type}" />
<meta property="og:site_name" content="TCG Matchmaker" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<link rel="canonical" href="${url}" />
<script type="application/ld+json">${jsonld}</script>
</head>
<body>
<h1>${title}</h1>
<p>${description}</p>
</body>
</html>`;
}

describe('Crawler detection', () => {
  it('detects Googlebot', () => {
    expect(isCrawler('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBe(true);
  });

  it('detects Bingbot', () => {
    expect(isCrawler('Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)')).toBe(true);
  });

  it('detects Facebook crawler', () => {
    expect(isCrawler('facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)')).toBe(true);
  });

  it('detects Twitterbot', () => {
    expect(isCrawler('Twitterbot/1.0')).toBe(true);
  });

  it('does not detect regular browsers', () => {
    expect(isCrawler('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0')).toBe(false);
  });

  it('does not detect empty user agent', () => {
    expect(isCrawler('')).toBe(false);
  });
});

describe('URL matching', () => {
  it('matches event detail paths', () => {
    const m = detailMatch('/matches/550e8400-e29b-41d4-a716-446655440000');
    expect(m).not.toBeNull();
    expect(m![1]).toBe('matches');
    expect(m![2]).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('matches trading detail paths', () => {
    const m = detailMatch('/trading/550e8400-e29b-41d4-a716-446655440000');
    expect(m![1]).toBe('trading');
  });

  it('matches tournament detail paths', () => {
    const m = detailMatch('/tournaments/550e8400-e29b-41d4-a716-446655440000');
    expect(m![1]).toBe('tournaments');
  });

  it('does not match non-detail paths', () => {
    expect(detailMatch('/matches')).toBeNull();
    expect(detailMatch('/matches/new')).toBeNull();
  });

  it('matches store detail paths', () => {
    const m = storeMatch('/stores/550e8400-e29b-41d4-a716-446655440000');
    expect(m).not.toBeNull();
    expect(m![1]).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('matches profile paths', () => {
    const m = profileMatch('/profile/johndoe');
    expect(m).not.toBeNull();
    expect(m![1]).toBe('johndoe');
  });
});

describe('HTML shell generation', () => {
  it('generates valid HTML with meta tags', () => {
    const html = htmlShell('Test Match', 'A test match', 'https://example.com/matches/1', 'Event', '{}');
    expect(html).toContain('<title>Test Match | TCG Matchmaker</title>');
    expect(html).toContain('<meta name="description" content="A test match" />');
    expect(html).toContain('<meta property="og:title" content="Test Match" />');
    expect(html).toContain('<meta property="og:type" content="Event" />');
    expect(html).toContain('<meta property="og:url" content="https://example.com/matches/1" />');
    expect(html).toContain('<meta name="twitter:card" content="summary" />');
    expect(html).toContain('<link rel="canonical" href="https://example.com/matches/1" />');
  });
});

describe('JSON-LD generation', () => {
  it('generates Event JSON-LD', () => {
    const event = { id: '1', type: 'match', name: 'Test Match', description: 'A test', scheduled_at: '2026-07-15T10:00:00Z', city: 'Fortaleza' };
    const ld = eventJsonLd(event);
    expect(ld).toContain('"@type":"Event"');
    expect(ld).toContain('"name":"Test Match"');
    expect(ld).toContain('"startDate":"2026-07-15T10:00:00Z"');
  });

  it('generates fallback name when name is null', () => {
    const event = { id: '1', type: 'trading', description: 'Trading session' };
    const ld = eventJsonLd(event);
    expect(ld).toContain('"name":"trading Event"');
  });
});
