import { useTranslation } from '../../../i18n';
import { FileViewerFallback } from './FileViewerFallback';
import type { FileResource } from '../types';

type Props = { file: FileResource; authToken?: string | null };

/**
 * Compatibility component kept for older callers.
 * Protected previews are now opened only by PdfViewerScreen after the backend
 * issues a short-lived access ticket; raw storage URLs are never consumed here.
 */
export function InAppFileViewer({ file }: Props) {
  const { t } = useTranslation();

  return (
    <FileViewerFallback
      message={t.files.viewer.protectedReadyMessage(String(file.id))}
      title={t.files.viewer.protectedReadyTitle}
    />
  );
}
