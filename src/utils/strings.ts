export function safeTrim(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

export function getInitials(name: string, fallback = '?'): string {
  const parts = safeTrim(name).split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return fallback;
  }

  const firstPart = parts[0] ?? '';
  const secondPart = parts[1] ?? '';
  const firstInitial = firstPart.charAt(0);
  const secondInitial = secondPart.charAt(0) || firstPart.charAt(1);
  const initials = `${firstInitial}${secondInitial}`.trim();

  return initials || fallback;
}
