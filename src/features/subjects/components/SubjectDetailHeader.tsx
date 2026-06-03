import { AppBadge, AppCard, AppText, Stack } from '../../../components';
import {
  getEntityLabel,
  getSubjectCode,
  getSubjectDescription,
  getSubjectDisplayName,
} from '../services';
import type { Subject } from '../types';
import { SubjectMetaRow } from './SubjectMetaRow';

type SubjectDetailHeaderProps = {
  subject: Subject;
};

export function SubjectDetailHeader({ subject }: SubjectDetailHeaderProps) {
  const title = getSubjectDisplayName(subject);
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
          <AppBadge label={code ? `رمز ${code}` : 'مادة'} variant="brand" />
        </Stack>

        <Stack gap="xs">
          <SubjectMetaRow label="السنة الأكاديمية" value={getEntityLabel(subject.academic_year)} />
          <SubjectMetaRow label="الفصل" value={getEntityLabel(subject.semester)} />
          <SubjectMetaRow label="الاختصاص" value={getEntityLabel(subject.major)} />
          <SubjectMetaRow
            label="ترتيب العرض"
            value={typeof subject.order === 'number' ? String(subject.order) : null}
          />
        </Stack>
      </Stack>
    </AppCard>
  );
}
