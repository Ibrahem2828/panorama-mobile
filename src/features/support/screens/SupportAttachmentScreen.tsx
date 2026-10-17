import { useCallback } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useTranslation } from '../../../i18n';
import type { ProfileStackParamList } from '../../../navigation/types';
import { ProtectedPreview } from '../../files/components/ProtectedPreview';
import { requestSupportAttachmentTicket, toSafeSupportErrorMessage } from '../services';

type Props = NativeStackScreenProps<ProfileStackParamList, 'SupportAttachment'>;

/** In-app, screen-capture-protected view of one support message attachment. */
export function SupportAttachmentScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { messageId, title } = route.params;
  const requestTicket = useCallback(
    (authToken: string) => requestSupportAttachmentTicket(messageId, authToken),
    [messageId],
  );
  const toErrorMessage = useCallback(
    (error: unknown) => toSafeSupportErrorMessage(error, t.support),
    [t],
  );

  return (
    <ProtectedPreview
      onBack={() => navigation.goBack()}
      pathPrefix="/api/v1/support/attachments/"
      requestTicket={requestTicket}
      subtitle={t.attachments.viewerSubtitle}
      title={title ?? t.attachments.viewerTitle}
      toErrorMessage={toErrorMessage}
    />
  );
}
