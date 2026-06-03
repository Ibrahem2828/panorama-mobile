import type { EntityId, VerificationStatus as ApiVerificationStatus } from '../../api';

export type VerificationStatus = ApiVerificationStatus | string;

export type VerificationRecord = {
  id?: EntityId;
  status: VerificationStatus;
  rejectionReason?: string | null;
  rejection_reason?: string | null;
  submitted_at?: string | null;
  updated_at?: string | null;
  card_image_url?: string | null;
};

export type VerificationCardImage = {
  uri: string;
  name: string;
  type: string;
  width?: number;
  height?: number;
  size?: number;
};

export type VerificationLoadOptions = {
  force?: boolean;
};

export type VerificationSubmissionMode = 'submit' | 'resubmit';
