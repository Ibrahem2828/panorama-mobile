import { useTranslation } from '../../../i18n';
import type { OfflineKind } from './licenseLogic';

/**
 * The strings of the offline download UI for one kind. Lectures use `offlineLectures` as written; library files override the
 * entries whose wording names the item («الملف» instead of «المحاضرة») and add the file-only states (preparing, too large).
 */
export function useOfflineCopy(kind: OfflineKind) {
  const { t } = useTranslation();
  const base = t.offlineLectures;
  const file = t.offlineFiles;

  if (kind === 'lecture') {
    return {
      ...base,
      preparing: file.preparing,
      preparingHint: file.preparingHint,
      errors: { ...base.errors, ...lectureExtras(t.offlineFiles) },
    };
  }

  return {
    ...base,
    downloaded: file.downloaded,
    availableUntil: file.availableUntil,
    preparing: file.preparing,
    preparingHint: file.preparingHint,
    errors: { ...base.errors, ...file.errors },
    viewer: { ...base.viewer, ...file.viewer },
  };
}

function lectureExtras(file: ReturnType<typeof useTranslation>['t']['offlineFiles']) {
  return { tooLarge: file.errors.tooLarge, notReady: file.errors.notReady };
}
