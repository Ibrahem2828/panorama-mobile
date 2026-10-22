import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * React Native (Android) forwards `source.headers` only when an Image's `source` is an array. With a single object the
 * `Authorization` / `X-Viewer-Session` headers are dropped and the backend answers 401, so lecture pages and chat images
 * never load. These Images carry authenticated requests and must keep the array form.
 */
const AUTHENTICATED_IMAGE_FILES = [
  'features/lectures/components/ViewerPageStage.tsx',
  'features/chat/components/ChatAttachmentViewer.tsx',
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
