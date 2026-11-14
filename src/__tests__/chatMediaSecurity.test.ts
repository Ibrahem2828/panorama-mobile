import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Chat attachments must stay inside the app: no share / save / export / open-with anywhere in the chat feature or the encrypted
 * store, only app-private storage, and the viewer must block screen capture. These are source-level guards so a later change
 * cannot quietly add a "save" button.
 */
const ROOT = path.resolve(__dirname, '..', '..');

function walk(dir: string): string[] {
  return readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? entry.name === '__tests__'
        ? []
        : walk(`${dir}/${entry.name}`)
      : /\.(ts|tsx)$/u.test(entry.name)
        ? [`${dir}/${entry.name}`]
        : [],
  );
}

const read = (file: string) => readFileSync(path.join(ROOT, file), 'utf8');
const files = [...walk('src/features/chat'), ...walk('src/security')];

describe('chat media never leaves the app', () => {
  it('has no sharing, saving, exporting or open-with code', () => {
    const forbidden =
      /expo-sharing|expo-media-library|MediaLibrary|Share\.share|from 'react-native-share'|saveToLibrary|createAssetAsync|expo-intent-launcher|IntentLauncher|startActivityAsync|openURL\(|Linking\.openURL|WebBrowser|FileProvider|downloadAsync|downloadFileAsync/u;
    const offenders = files.filter((file) => forbidden.test(read(file)));

    expect(offenders).toEqual([]);
  });

  it('never writes outside app-private directories', () => {
    const external =
      /Paths\.(?!document|cache)\w+|getExternalStorage|ExternalStorage|DCIM|Pictures|Downloads/u;
    const offenders = files.filter((file) => external.test(read(file)));

    expect(offenders).toEqual([]);
  });

  it('blocks screen capture while the chat viewer is open, even in tester builds', () => {
    const viewer = read('src/features/chat/components/ChatMediaViewer.tsx');

    expect(viewer).toMatch(/preventScreenCaptureAsync\(VIEWER_SECURE_KEY\)/);
    expect(viewer).toMatch(/allowScreenCaptureAsync\(VIEWER_SECURE_KEY\)/);
  });

  it('keeps the viewer free of long-press menus', () => {
    for (const file of [
      'src/features/chat/components/ChatMediaViewer.tsx',
      'src/features/chat/media/components/ZoomableImage.tsx',
      'src/features/chat/media/components/ChatPdfPages.tsx',
    ]) {
      expect(read(file)).not.toMatch(/onLongPress/u);
    }
  });

  it('releases the decrypted temp copy when the viewer closes', () => {
    expect(read('src/features/chat/components/ChatMediaViewer.tsx')).toMatch(/release\(\)/u);
  });

  it('wipes the encrypted chat cache when the signed-in user changes or signs out', () => {
    expect(read('src/offline/authSync.ts')).toMatch(/clearChatMediaCache\(\)/u);
  });
});

describe('manifest', () => {
  it('allows the microphone (voice messages) but no storage or background audio', () => {
    const config = read('app.config.ts');
    const blocked = /blockedPermissions:\s*\[([\s\S]*?)\]/u.exec(config)?.[1] ?? '';

    expect(blocked).not.toMatch(/RECORD_AUDIO/u);
    expect(blocked).toMatch(/READ_EXTERNAL_STORAGE/u);
    expect(blocked).toMatch(/WRITE_EXTERNAL_STORAGE/u);
    expect(config).toMatch(/enableBackgroundPlayback: false/u);
    expect(config).toMatch(/enableBackgroundRecording: false/u);
  });
});
