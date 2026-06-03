import { AppBadge, AppCard, AppText, Stack } from '../../../components';
import type { StatusVariant } from '../../../types/common';

type AcademicInfoField = {
  label: string;
  value: string;
};

type AcademicInfoCardProps = {
  title?: string;
  fields: AcademicInfoField[];
  statusLabel?: string;
  statusVariant?: StatusVariant;
  note?: string;
};

export function AcademicInfoCard({
  title = 'المعلومات الأكاديمية',
  fields,
  statusLabel,
  statusVariant = 'neutral',
  note,
}: AcademicInfoCardProps) {
  return (
    <AppCard variant="outlined">
      <Stack gap="md">
        <Stack direction="horizontal" gap="sm" wrap>
          <AppText style={{ flex: 1, minWidth: 0 }} variant="title">
            {title}
          </AppText>
          {statusLabel ? <AppBadge label={statusLabel} variant={statusVariant} /> : null}
        </Stack>

        <Stack gap="sm">
          {fields.map((field) => (
            <Stack direction="horizontal" gap="md" key={field.label}>
              <AppText color="muted" style={{ width: 104 }} variant="caption">
                {field.label}
              </AppText>
              <AppText style={{ flex: 1, minWidth: 0 }} variant="bodySmall">
                {field.value}
              </AppText>
            </Stack>
          ))}
        </Stack>

        {note ? (
          <AppText color="secondary" variant="caption">
            {note}
          </AppText>
        ) : null}
      </Stack>
    </AppCard>
  );
}
