import { Image, StyleSheet } from 'react-native';

import { AppCard } from '../../../components';
import { colors, radius, spacing } from '../../../theme';
import { getFileUri, getFileViewerType } from '../services';
import type { FileResource } from '../types';
import { FileViewerFallback } from './FileViewerFallback';

type InAppFileViewerProps = {
  file: FileResource;
  authToken?: string | null;
};

const MISSING_URL_MESSAGE = 'لا يتوفر رابط صالح لعرض الملف.';
const UNSUPPORTED_MESSAGE = 'سيتم دعم عرض هذا النوع من الملفات داخل التطبيق في المرحلة التالية.';
const PDF_FALLBACK_MESSAGE =
  'عارض PDF المتقدم غير مثبت في هذه المرحلة. سيتم تحسين عرض ملفات PDF داخل التطبيق لاحقا.';

export function InAppFileViewer({ file, authToken }: InAppFileViewerProps) {
  const viewerType = getFileViewerType(file);
  const fileUri = getFileUri(file);
  const authorizationHeader = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;

  if (!fileUri) {
    return <FileViewerFallback message={MISSING_URL_MESSAGE} />;
  }

  if (viewerType === 'image') {
    return (
      <AppCard padding="none" style={styles.imageCard} variant="elevated">
        <Image
          resizeMode="contain"
          source={{ uri: fileUri, headers: authorizationHeader }}
          style={styles.image}
        />
      </AppCard>
    );
  }

  if (viewerType === 'pdf' || viewerType === 'document') {
    return <FileViewerFallback message={PDF_FALLBACK_MESSAGE} title="عارض داخلي قيد التحسين" />;
  }

  return <FileViewerFallback message={UNSUPPORTED_MESSAGE} title="نوع ملف غير مدعوم حاليا" />;
}

const styles = StyleSheet.create({
  imageCard: {
    overflow: 'hidden',
    minHeight: 360,
    backgroundColor: colors.background.surface,
    borderRadius: radius.card,
  },
  image: {
    width: '100%',
    minHeight: 360,
    backgroundColor: colors.gray[50],
    padding: spacing.md,
  },
});
