import type { IconName } from '../icons';

export type ArtworkTone = 'brand' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

export type ArtworkSpec = {
  icon: IconName;
  tone?: ArtworkTone;
};

/** Icon-based artwork used instead of bitmap illustrations for empty/error/status states. */
export const artworks = {
  files: { icon: 'folder' },
  fileDocument: { icon: 'file' },
  filePdf: { icon: 'file', tone: 'error' },
  fileImage: { icon: 'image', tone: 'info' },
  fileLocked: { icon: 'lock', tone: 'warning' },
  previewError: { icon: 'alert', tone: 'warning' },
  groups: { icon: 'users' },
  announcements: { icon: 'megaphone' },
  notifications: { icon: 'bell' },
  printing: { icon: 'printer' },
  printingPending: { icon: 'clock', tone: 'warning' },
  printingProcessing: { icon: 'printer', tone: 'info' },
  printingReady: { icon: 'check', tone: 'success' },
  printingCompleted: { icon: 'check', tone: 'success' },
  printingCancelled: { icon: 'close', tone: 'error' },
  subjects: { icon: 'book' },
  support: { icon: 'help' },
  chat: { icon: 'chat' },
  search: { icon: 'search' },
  warning: { icon: 'alert', tone: 'warning' },
  error: { icon: 'alert', tone: 'error' },
  network: { icon: 'wifiOff', tone: 'neutral' },
  success: { icon: 'check', tone: 'success' },
  lectures: { icon: 'lecture' },
  verification: { icon: 'shield', tone: 'brand' },
} as const satisfies Record<string, ArtworkSpec>;

export type ArtworkKey = keyof typeof artworks;
