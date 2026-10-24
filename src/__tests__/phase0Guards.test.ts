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
