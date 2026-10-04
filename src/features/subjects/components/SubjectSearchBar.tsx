import { AppText, AppTextInput, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';

type SubjectSearchBarProps = {
  value: string;
  resultCount: number;
  totalCount: number;
  onChangeText: (value: string) => void;
};

export function SubjectSearchBar({
  value,
  resultCount,
  totalCount,
  onChangeText,
}: SubjectSearchBarProps) {
  const { t } = useTranslation();
  return (
    <Stack gap="sm">
      <AppTextInput
        label={t.common.searchLocal}
        onChangeText={onChangeText}
        placeholder={t.subjects.searchPlaceholder}
        returnKeyType="search"
        value={value}
      />
      <AppText color="muted" variant="caption">
        {t.subjects.searchNote(resultCount, totalCount)}
      </AppText>
    </Stack>
  );
}
