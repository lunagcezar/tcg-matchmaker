export function eventRoute(event: { type?: string; id?: string }): string {
  const t = event.type;
  const id = event.id;
  if (t === 'match') return `/matches/${id}`;
  if (t === 'trading') return `/trading/${id}`;
  if (t === 'tournament') return `/tournaments/${id}`;
  return '/';
}
