import { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';

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
const PREVIEW_ERROR_MESSAGE = 'حاول مرة أخرى أو تواصل مع الدعم إذا استمرت المشكلة.';
const PREVIEW_ERROR_TITLE = 'تعذر معاينة الملف';
const UNSUPPORTED_MESSAGE = 'سيتم دعم عرض هذا النوع من الملفات داخل التطبيق في المرحلة التالية.';
const PDF_FALLBACK_MESSAGE =
  'عارض PDF المتقدم غير مثبت في هذه المرحلة. سيتم تحسين عرض ملفات PDF داخل التطبيق لاحقا.';

export function InAppFileViewer({ file, authToken }: InAppFileViewerProps) {
  const viewerType = getFileViewerType(file);
  const fileUri = getFileUri(file);
  const authorizationHeader = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [hasImageError, setHasImageError] = useState(false);

  if (!fileUri) {
    return <FileViewerFallback message={MISSING_URL_MESSAGE} />;
  }

  if (viewerType === 'image') {
    if (hasImageError) {
      return <FileViewerFallback message={PREVIEW_ERROR_MESSAGE} title={PREVIEW_ERROR_TITLE} />;
    }

    return (
      <AppCard padding="none" style={styles.imageCard} variant="elevated">
        {isImageLoading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={colors.brand.primary} size="large" />
          </View>
        ) : null}
        <Image
          onError={() => {
            setHasImageError(true);
            setIsImageLoading(false);
          }}
          onLoadEnd={() => setIsImageLoading(false)}
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
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    backgroundColor: colors.background.surface,
  },
});
