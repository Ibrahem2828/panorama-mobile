import { AppText, AppTextInput, Stack } from '../../../components';

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
  return (
    <Stack gap="sm">
      <AppTextInput
        label="بحث محلي"
        onChangeText={onChangeText}
        placeholder="ابحث باسم المادة أو رمزها"
        returnKeyType="search"
        value={value}
      />
      <AppText color="muted" variant="caption">
        يتم البحث داخل المواد المحملة فقط. النتائج: {resultCount} من {totalCount}.
      </AppText>
    </Stack>
  );
}
