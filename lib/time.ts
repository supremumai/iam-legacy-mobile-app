export function formatRelativeTime(isoString: string, locale: string = 'en'): string {
  const now = new Date();
  const then = new Date(isoString);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const es = locale === 'es';
  // 'es-US' keeps 12-hour AM/PM for US Hispanic users; 'es-ES'/'es-MX' would switch to 24h.
  const intlLocale = es ? 'es-US' : 'en-US';

  if (diffSec < 60) return es ? 'ahora mismo' : 'just now';

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return es ? `hace ${diffMin}m` : `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return es ? `hace ${diffHr}h` : `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return es ? `hace ${diffDay}d` : `${diffDay}d ago`;

  const currentYear = now.getFullYear();
  const thenYear = then.getFullYear();

  if (thenYear !== currentYear) {
    return then.toLocaleDateString(intlLocale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return then.toLocaleDateString(intlLocale, {
    month: 'short',
    day: 'numeric',
  });
}
