const API_BASE = 'https://tcg-matchmaker.workers.dev';
const SITE_URL = 'https://tcg-matchmaker.pages.dev';
const APP_NAME = 'TCG Matchmaker';

const CRAWLER_PATTERNS = [
  /Googlebot/i,
  /Bingbot/i,
  /Slurp/i,
  /DuckDuckBot/i,
  /Baiduspider/i,
  /YandexBot/i,
  /facebookexternalhit/i,
  /Twitterbot/i,
  /LinkedInBot/i,
  /WhatsApp/i,
  /Applebot/i,
  /SemrushBot/i,
  /PetalBot/i,
  /AwarioSmartBot/i,
  /SeekportBot/i,
  /DotBot/i,
];

function isCrawler(userAgent: string): boolean {
  return CRAWLER_PATTERNS.some((p) => p.test(userAgent));
}

function htmlShell(
  title: string,
  description: string,
  url: string,
  type: string,
  jsonld: string,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title} | ${APP_NAME}</title>
<meta name="description" content="${description}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:url" content="${url}" />
<meta property="og:type" content="${type}" />
<meta property="og:site_name" content="${APP_NAME}" />
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

function eventJsonLd(event: Record<string, unknown>): string {
  const startDate = (event.scheduled_at as string) || '';
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: (event.name as string) || `${String(event.type)} Event`,
    description: (event.description as string) || '',
    startDate,
    location: {
      '@type': 'Place',
      name: (event.custom_location_name as string) || undefined,
      address: { '@type': 'PostalAddress', addressLocality: (event.city as string) || 'Fortaleza' },
    },
  });
}

function storeJsonLd(store: Record<string, unknown>): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: store.name,
    description: store.description,
    telephone: store.phone,
    url: store.website,
    address: {
      '@type': 'PostalAddress',
      streetAddress: store.address,
      addressLocality: store.city,
      addressRegion: store.state,
      addressCountry: store.country || 'BR',
    },
  });
}

async function fetchJson(path: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    const body = (await res.json()) as { data: Record<string, unknown> | null };
    return body.data ?? null;
  } catch {
    return null;
  }
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

export async function onRequest(context: {
  request: Request;
  next: () => Promise<Response>;
  waitUntil: (p: Promise<unknown>) => void;
}): Promise<Response> {
  const url = new URL(context.request.url);
  const { pathname } = url;
  const userAgent = context.request.headers.get('User-Agent') || '';

  if (pathname === '/robots.txt') {
    return handleRobotsTxt();
  }
  if (pathname === '/sitemap.xml') {
    return handleSitemap(context);
  }

  if (!isCrawler(userAgent)) {
    return context.next();
  }

  const eventMd = detailMatch(pathname);
  if (eventMd) {
    const eventType = eventMd[1]!;
    const eventId = eventMd[2]!;
    const data = await fetchJson(`/api/events/${eventId}`);
    if (data) {
      const title = (data.name as string) || `${eventType.slice(0, -1)} Event`;
      const desc = (data.description as string) || `View ${title} on ${APP_NAME}`;
      const fullUrl = `${SITE_URL}${pathname}`;
      const jsonld = eventJsonLd(data);
      return new Response(htmlShell(title, desc, fullUrl, 'Event', jsonld), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
  }

  const storeMd = storeMatch(pathname);
  if (storeMd) {
    const storeId = storeMd[1]!;
    const data = await fetchJson(`/api/stores/${storeId}`);
    if (data) {
      const title = (data.name as string) || 'Game Store';
      const desc = (data.description as string) || `Visit ${title} on ${APP_NAME}`;
      const fullUrl = `${SITE_URL}${pathname}`;
      const jsonld = storeJsonLd(data);
      return new Response(htmlShell(title, desc, fullUrl, 'LocalBusiness', jsonld), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
  }

  const profileMd = profileMatch(pathname);
  if (profileMd) {
    const username = profileMd[1]!;
    const title = `@${username}`;
    const desc = `View ${username}'s TCG event history on ${APP_NAME}`;
    const fullUrl = `${SITE_URL}${pathname}`;
    return new Response(htmlShell(title, desc, fullUrl, 'Profile', '{}'), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  return context.next();
}

function handleRobotsTxt(): Response {
  const content = `User-agent: *
Allow: /
Allow: /matches/
Allow: /trading/
Allow: /tournaments/
Allow: /stores/
Allow: /profile/
Disallow: /admin/
Disallow: /settings
Disallow: /notifications
Disallow: /matches/new
Disallow: /trading/new
Disallow: /tournaments/new
Disallow: /stores/new
Disallow: /login
Disallow: /signup

Sitemap: ${SITE_URL}/sitemap.xml
`;
  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

function handleSitemap(context: { waitUntil: (p: Promise<unknown>) => void }): Response {
  const entries: Array<{ loc: string; priority: string }> = [
    { loc: '/', priority: '1.0' },
    { loc: '/matches', priority: '0.9' },
    { loc: '/trading', priority: '0.8' },
    { loc: '/tournaments', priority: '0.9' },
    { loc: '/stores', priority: '0.8' },
    { loc: '/login', priority: '0.3' },
    { loc: '/signup', priority: '0.3' },
  ];

  context.waitUntil(
    (async () => {
      try {
        const [eventsRes, storesRes] = await Promise.all([
          fetch(`${API_BASE}/api/events`),
          fetch(`${API_BASE}/api/stores`),
        ]);
        const events =
          ((await eventsRes.json()) as { data: Array<Record<string, unknown>> }).data || [];
        const stores =
          ((await storesRes.json()) as { data: Array<Record<string, unknown>> }).data || [];
        for (const e of events) {
          const t = String(e.type);
          const segment = t === 'match' ? 'matches' : t === 'trading' ? 'trading' : 'tournaments';
          entries.push({ loc: `/${segment}/${String(e.id)}`, priority: '0.6' });
        }
        for (const s of stores) {
          entries.push({ loc: `/stores/${String(s.id)}`, priority: '0.6' });
        }
      } catch {
        /* best-effort */
      }
    })(),
  );

  const urls = entries
    .map((e) => `  <url><loc>${SITE_URL}${e.loc}</loc><priority>${e.priority}</priority></url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
