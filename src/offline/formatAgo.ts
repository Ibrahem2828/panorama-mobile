type AgoStrings = {
  justNow: string;
  minutesAgo: (count: number) => string;
  hoursAgo: (count: number) => string;
  daysAgo: (count: number) => string;
};

/** "just now / 5 min ago / 3 h ago / 2 d ago" for the age of saved data; future timestamps count as "just now". */
export function formatAgo(savedAt: number, now: number, strings: AgoStrings): string {
  const minutes = Math.floor(Math.max(0, now - savedAt) / 60_000);

  if (minutes < 1) {
    return strings.justNow;
  }

  if (minutes < 60) {
    return strings.minutesAgo(minutes);
  }

  const hours = Math.floor(minutes / 60);

  return hours < 24 ? strings.hoursAgo(hours) : strings.daysAgo(Math.floor(hours / 24));
}
