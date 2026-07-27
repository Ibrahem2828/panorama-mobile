import type { ReactNode } from 'react';

import { FeedbackPromptModal } from './components';

type Props = { children: ReactNode };

export function FeedbackProvider({ children }: Props) {
  return (
    <>
      {children}
      <FeedbackPromptModal />
    </>
  );
}
