import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * React Native (Android) forwards `source.headers` only when an Image's `source` is an array. With a single object the
 * `Authorization` / `X-Viewer-Session` headers are dropped and the backend answers 401, so lecture pages and chat images
 * never load. These Images carry authenticated requests and must keep the array form.
 */
const AUTHENTICATED_IMAGE_FILES = [
  'features/lectures/components/ViewerPageStage.tsx',
  'features/printing/components/PrintOptionHelpSheet.tsx',
  'features/store/components/StoreImage.tsx',
  'components/common/AuthenticatedImage.tsx',
];

describe('authenticated Images', () => {
  it.each(AUTHENTICATED_IMAGE_FILES)('%s passes source as an array', (file) => {
    const text = readFileSync(path.resolve(__dirname, '..', file), 'utf8');
    const imageSources = [...text.matchAll(/<Image[\s\S]*?\/>/g)].map((match) => match[0]);

    expect(imageSources.length).toBeGreaterThan(0);
    for (const image of imageSources) {
      expect(image).toMatch(/source=\{\[/);
    }
  });
});

/**
 * Group, announcement and ready-product pictures are authenticated API URLs (a plain Image gets 401). Every screen that
 * shows them must go through AuthenticatedImage / AppAvatar, never a bare react-native `<Image>` fed those fields.
 */
const SCREENS_WITH_API_PICTURES = [
  'features/announcements/components/AnnouncementListItem.tsx',
  'features/announcements/screens/AnnouncementDetailScreen.tsx',
  'features/groups/components/GroupCard.tsx',
  'features/groups/components/GroupDetailHeader.tsx',
  'features/printing/screens/PrintProductsScreen.tsx',
  'features/printing/components/PrintItemCard.tsx',
  'components/common/AppAvatar.tsx',
];

describe('API pictures are never plain Images', () => {
  it.each(SCREENS_WITH_API_PICTURES)('%s has no plain <Image> of an API picture', (file) => {
    const text = readFileSync(path.resolve(__dirname, '..', file), 'utf8');
    const images = [...text.matchAll(/<Image[\s\S]*?\/>/g)].map((match) => match[0]);

    for (const image of images) {
      expect(image).not.toMatch(/image_url|imageUrl|imageUri|\.image/);
    }
  });

  it('AppAvatar renders its picture through AuthenticatedImage', () => {
    const text = readFileSync(
      path.resolve(__dirname, '../components/common/AppAvatar.tsx'),
      'utf8',
    );

    expect(text).toContain('<AuthenticatedImage');
    expect(text).not.toMatch(/import \{[^}]*Image[^}]*\} from 'react-native'/);
  });
});
