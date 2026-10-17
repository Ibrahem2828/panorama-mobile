import { useCallback } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useTranslation } from '../../../i18n';
import type { PrintingStackParamList } from '../../../navigation/types';
import { ProtectedPreview } from '../../files/components/ProtectedPreview';
import { requestPrintItemTicket, toSafePrintingErrorMessage } from '../services';

type Props = NativeStackScreenProps<PrintingStackParamList, 'PrintItemViewer'>;

/** In-app, screen-capture-protected view of one file of a print order. */
export function PrintItemViewerScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { itemId, title } = route.params;
  const requestTicket = useCallback(
    (authToken: string) => requestPrintItemTicket(itemId, authToken),
    [itemId],
  );
  const toErrorMessage = useCallback(
    (error: unknown) => toSafePrintingErrorMessage(error, t.printing),
    [t],
  );

  return (
    <ProtectedPreview
      onBack={() => navigation.goBack()}
      pathPrefix="/api/v1/protected-print-items/"
      requestTicket={requestTicket}
      subtitle={t.printing.itemViewer.subtitle}
      title={title ?? t.printing.itemViewer.title}
      toErrorMessage={toErrorMessage}
    />
  );
}
