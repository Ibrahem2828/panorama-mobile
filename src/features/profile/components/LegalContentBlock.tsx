import { AppCard, AppText, Stack } from '../../../components';

type LegalContentBlockProps = {
  title: string;
  paragraphs: readonly string[];
};

export function LegalContentBlock({ title, paragraphs }: LegalContentBlockProps) {
  return (
    <AppCard variant="default">
      <Stack gap="md">
        <AppText variant="title">{title}</AppText>
        {paragraphs.map((paragraph) => (
          <AppText color="secondary" key={paragraph} variant="bodySmall">
            {paragraph}
          </AppText>
        ))}
      </Stack>
    </AppCard>
  );
}
