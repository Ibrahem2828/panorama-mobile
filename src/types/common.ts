import type { ReactNode } from 'react';

export type AppEnvironment = 'development' | 'preview' | 'production';

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export type Nullable<T> = T | null;

export type Maybe<T> = T | null | undefined;

export type SizeVariant = 'sm' | 'md' | 'lg';

export type ComponentSize = SizeVariant | 'xl';

export type StatusVariant = 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'brand';

export type ChildrenProps = {
  children: ReactNode;
};

export type ApiEnvelope<TData, TErrors = unknown> = {
  success: boolean;
  message: string;
  data: TData;
  errors: TErrors | null;
};

export type PaginatedResponse<TItem> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: TItem[];
};
