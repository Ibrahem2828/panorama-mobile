import { FileViewerFallback } from './FileViewerFallback';
import type { FileResource } from '../types';

type Props = { file: FileResource; authToken?: string | null };

/**
 * Compatibility component kept for older callers.
 * Protected previews are now opened only by PdfViewerScreen after the backend
 * issues a short-lived access ticket; raw storage URLs are never consumed here.
 */
export function InAppFileViewer({ file }: Props) {
  return (
    <FileViewerFallback
      message={`استخدم زر فتح داخل التطبيق لإصدار تذكرة عرض آمنة للملف ${String(file.id)}.`}
      title="العرض المحمي جاهز"
    />
  );
}
