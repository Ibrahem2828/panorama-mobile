import { images } from '../../../assets/images';
import { EmptyState } from '../../../components';
import { useTranslation } from '../../../i18n';

export function ChatEmptyState() {
  const { t } = useTranslation();
  return (
    <EmptyState
      message={t.chat.emptyMessage}
      title={t.chat.emptyTitle}
      illustrationLabel={t.chat.emptyIllustrationAlt}
      illustrationSource={images.emptyStates.chat}
    />
  );
}
