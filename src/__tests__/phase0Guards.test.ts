import { readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..', '..');
const read = (file: string) => readFileSync(path.join(ROOT, file), 'utf8');

describe('protected file viewers', () => {
  it('send the signed-in user with the file request (the stream endpoint answers 401 without it)', () => {
    const preview = read('src/features/files/components/ProtectedPreview.tsx');

    expect(preview).toMatch(/Authorization: `Bearer \$\{accessToken\}`/);
    expect(preview).toMatch(/onHttpError=/);
  });

  it('turn a refused chat attachment request into a retryable message', () => {
    expect(read('src/features/chat/components/ChatAttachmentViewer.tsx')).toMatch(/onHttpError=/);
  });
});

describe('release size', () => {
  it('compresses the native libraries inside the APK', () => {
    expect(read('app.config.ts')).toMatch(/set\('expo\.useLegacyPackaging', 'true'\)/);
  });
});

describe('protected viewer does not hand non-image files to the web view', () => {
  const read = (path: string) => require('fs').readFileSync(path, 'utf8') as string;

  it('checks canRender after prepare and explains instead of opening the web view', () => {
    const source = read('src/features/files/components/ProtectedPreview.tsx');

    expect(source).toContain('canRender');
    expect(source).toContain('notSupportedYet');
  });

  it('library files open in the unified page viewer, never in a web view', () => {
    const source = read('src/features/files/screens/PdfViewerScreen.tsx');

    expect(source).toContain('DocumentViewerBody');
    expect(source).not.toContain('WebView');
  });
});

describe('chat control frames', () => {
  it('are never sent through send(), which wraps its text as a visible chat message', () => {
    const store = require('fs').readFileSync(
      'src/features/chat/store/chatStore.ts',
      'utf8',
    ) as string;

    expect(store).not.toMatch(/\.send\(\s*JSON\.stringify/u);
    expect(store).toContain('sendFrame');
  });
});
