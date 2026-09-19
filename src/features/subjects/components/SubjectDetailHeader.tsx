import { AppBadge, AppCard, AppText, Stack } from '../../../components';
import {
  getEntityLabel,
  getSubjectCode,
  getSubjectDescription,
  getSubjectDisplayName,
} from '../services';
import type { Subject } from '../types';
import { SubjectMetaRow } from './SubjectMetaRow';
import { useTranslation } from '../../../i18n';

type SubjectDetailHeaderProps = {
  subject: Subject;
};

export function SubjectDetailHeader({ subject }: SubjectDetailHeaderProps) {
  const { t } = useTranslation();
  const title = getSubjectDisplayName(subject, t.subjects);
  const code = getSubjectCode(subject);
  const description = getSubjectDescription(subject);

  return (
    <AppCard variant="elevated">
      <Stack gap="lg">
        <Stack direction="horizontal" gap="md" style={{ alignItems: 'flex-start' }}>
          <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
            <AppText variant="h2">{title}</AppText>
            {description ? (
              <AppText color="secondary" variant="bodySmall">
                {description}
              </AppText>
            ) : null}
          </Stack>
          <AppBadge label={code ? t.subjects.codeBadge(code) : t.subjects.badge} variant="brand" />
        </Stack>

        <Stack gap="xs">
          <SubjectMetaRow
            label={t.subjects.details.academicYearLabel}
            value={getEntityLabel(subject.academic_year)}
          />
          <SubjectMetaRow
            label={t.subjects.details.semesterLabel}
            value={getEntityLabel(subject.semester)}
          />
          <SubjectMetaRow
            label={t.subjects.details.majorLabel}
            value={getEntityLabel(subject.major)}
          />
          <SubjectMetaRow
            label={t.subjects.details.orderLabel}
            value={typeof subject.order === 'number' ? String(subject.order) : null}
          />
        </Stack>
      </Stack>
    </AppCard>
  );
}
