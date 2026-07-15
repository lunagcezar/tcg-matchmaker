export function badgeColor(status: string | undefined): string {
  if (status === 'confirmed') return 'positive';
  if (status === 'declined') return 'negative';
  if (status === 'checked_in') return 'info';
  return 'warning';
}

export function statusColor(status: string | undefined): string {
  if (status === 'open' || status === 'active' || status === 'planned') return 'primary';
  if (status === 'confirmed' || status === 'completed') return 'positive';
  if (status === 'cancelled') return 'negative';
  if (status === 'in_progress') return 'info';
  if (status === 'draft') return 'grey';
  return 'grey';
}

export function roleColor(role: string | undefined): string {
  if (role === 'admin') return 'red';
  if (role === 'organizer') return 'warning';
  return 'primary';
}

export function eventColor(type: string | undefined): string {
  if (type === 'match') return 'primary';
  if (type === 'trading') return 'positive';
  return 'warning';
}

export function memberRoleColor(role: string): string {
  if (role === 'owner') return 'red';
  if (role === 'manager') return 'warning';
  return 'primary';
}

export function matchStatusColor(status: string | undefined): string {
  if (status === 'completed') return 'positive';
  if (status === 'walkover') return 'warning';
  if (status === 'in_progress') return 'info';
  return 'grey';
}

export function notificationIcon(type: string): string {
  if (type.includes('invite') || type.includes('challenge')) return 'mail';
  if (type.includes('bracket') || type.includes('advance') || type.includes('tournament'))
    return 'emoji_events';
  if (type.includes('store') || type.includes('moderation')) return 'gavel';
  if (type.includes('rsvp') || type.includes('confirm')) return 'event';
  return 'notifications';
}
