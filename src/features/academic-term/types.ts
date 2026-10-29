import type { CurrentTermResponse, TermSemester } from '../../api/services/academic.service';

export type { CurrentTermResponse, TermSemester };

export type TermOption = { id: string | number; name: string };

/** What went wrong with the last confirmation attempt; `network` keeps the sheet open with a retry. */
export type TermSubmitError = 'network' | 'generic' | null;
