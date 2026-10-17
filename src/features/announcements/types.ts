import type { EntityId } from '../../api';

export type AcademicTargetKey = 'university' | 'faculty' | 'major' | 'year' | 'semester';

export type AudienceKey = 'all' | 'students' | 'verified' | 'normal' | 'admins' | 'custom';

export type AnnouncementItem = {
  id: EntityId;
  title: string | null;
  body: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string | null;
  createdByName: string | null;
  targetUserType: string | null;
  academicTargets: AcademicTargetKey[];
};
