export function getInitials(fullName?: string | null, username?: string | null): string {
  if (fullName) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts[0].length > 0) return parts[0][0].toUpperCase();
  }
  if (username && username.length > 0) return username[0].toUpperCase();
  return '?';
}
