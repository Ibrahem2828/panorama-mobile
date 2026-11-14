/** "12.4 MB", "830 KB", "1.5 GB": short, locale independent units (Latin digits keep sizes aligned in both languages). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 KB';
  }

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${Math.max(1, Math.round(kb))} KB`;
  }

  const mb = kb / 1024;

  if (mb < 1024) {
    return `${mb.toFixed(mb >= 100 ? 0 : 1)} MB`;
  }

  return `${(mb / 1024).toFixed(1)} GB`;
}

export function percentOf(done: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.floor((done / total) * 100)));
}
