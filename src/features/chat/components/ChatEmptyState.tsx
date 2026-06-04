import { EmptyState } from '../../../components';

export function ChatEmptyState() {
  return (
    <EmptyState
      message="لا توجد رسائل بعد. كن أول من يبدأ النقاش إذا كانت صلاحية الإرسال متاحة."
      title="لا توجد رسائل بعد"
    />
  );
}
