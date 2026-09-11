import { DateTime } from 'luxon';

import { useAppStore } from '@/stores/useAppStore';

const FALLBACK = '-';

function createDateTime(iso: string | undefined | null): DateTime | null {
  if (!iso) return null;
  const dt = DateTime.fromISO(iso);
  if (!dt.isValid) return null;
  const appStore = useAppStore();
  return dt.setLocale(appStore.locale).setZone('local');
}

export function useFormatDate() {
  function formatDate(iso?: string | null): string {
    return createDateTime(iso)?.toLocaleString(DateTime.DATE_MED) ?? FALLBACK;
  }

  function formatTime(iso?: string | null): string {
    return createDateTime(iso)?.toLocaleString(DateTime.TIME_SIMPLE) ?? FALLBACK;
  }

  function formatDateTime(iso?: string | null): string {
    return createDateTime(iso)?.toLocaleString(DateTime.DATETIME_MED) ?? FALLBACK;
  }

  function formatRelative(iso?: string | null): string {
    const dt = createDateTime(iso);
    if (!dt) return FALLBACK;
    return dt.toRelative() ?? FALLBACK;
  }

  return { formatDate, formatTime, formatDateTime, formatRelative };
}
