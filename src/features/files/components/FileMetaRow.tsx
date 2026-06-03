import { AppText, Stack } from '../../../components';

type FileMetaRowProps = {
  label: string;
  value?: string | null;
};

export function FileMetaRow({ label, value }: FileMetaRowProps) {
  if (!value) {
    return null;
  }

  return (
    <Stack direction="horizontal" gap="sm">
      <AppText color="muted" variant="caption">
        {label}
      </AppText>
      <AppText color="secondary" variant="bodySmall">
        {value}
      </AppText>
    </Stack>
  );
}
