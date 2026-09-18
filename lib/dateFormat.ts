// Maps the app locale ('en' | 'es') to the BCP 47 locale tag used for Intl APIs.
// 'es-US' gives Spanish month/day names while preserving the 12-hour AM/PM format
// expected by US Hispanic users — 'es-ES' and 'es-MX' switch to 24h, so avoid them.
function toIntlLocale(appLocale: string): string {
  return appLocale === 'es' ? 'es-US' : 'en-US';
}

/**
 * Uppercased short month from an ISO date string, parsed as local date to prevent
 * UTC-offset from shifting the displayed day.
 * e.g. "2024-12-10" → "DEC" (en) or "DIC" (es)
 */
export function formatIsoMonthUpper(iso: string, locale: string): string {
  const parts = iso.split('T')[0].split('-');
  if (parts.length < 3) return '—';
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  return new Date(y, m, d).toLocaleString(toIntlLocale(locale), { month: 'short' }).toUpperCase();
}

/**
 * "MMM D" label from a Date object (UTC-based, matches stored event_date strings).
 * e.g. "DEC 10" (en) or "DIC 10" (es)
 */
export function formatMonthDayLabel(date: Date, locale: string): string {
  return (
    date.toLocaleString(toIntlLocale(locale), { month: 'short' }).toUpperCase() +
    ' ' +
    date.getDate()
  );
}

/**
 * "MMM D, YYYY" from a Date object.
 * e.g. "Dec 10, 2024" (en) or "dic. 10, 2024" (es)
 */
export function formatDateFull(date: Date, locale: string): string {
  return date.toLocaleDateString(toIntlLocale(locale), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * "MMM D" from a Date object (no year).
 * e.g. "Dec 10" (en) or "dic. 10" (es)
 */
export function formatDateShort(date: Date, locale: string): string {
  return date.toLocaleDateString(toIntlLocale(locale), {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * 12-hour time string (no seconds).
 * e.g. "7:00 PM" (en) or "7:00 p. m." (es-US)
 */
export function formatTime(date: Date, locale: string): string {
  return date.toLocaleTimeString(toIntlLocale(locale), {
    hour: 'numeric',
    minute: '2-digit',
  });
}
