import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Source-level guards for the leak-proof promise of downloaded lectures: nothing is exported, shared or written outside the
 * app-private folders, the viewer blocks screen capture, and sign-out wipes everything. A later change cannot quietly add a
 * "save to phone" button without failing here.
 */
const ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');
const OFFLINE_DIR = 'src/features/lectures/offline';

const read = (file: string) => readFileSync(path.join(ROOT, file), 'utf8');
const files = readdirSync(path.join(ROOT, OFFLINE_DIR))
  .filter((name) => /\.(ts|tsx)$/u.test(name))
  .map((name) => `${OFFLINE_DIR}/${name}`);

describe('downloaded lectures never leave the app', () => {
  it('has no sharing, saving, exporting, open-with or public-storage code', () => {
    const forbidden =
      /expo-sharing|expo-media-library|MediaLibrary|Share\.share|react-native-share|saveToLibrary|createAssetAsync|expo-intent-launcher|IntentLauncher|startActivityAsync|Linking\.openURL|WebBrowser|FileProvider|downloadAsync|downloadFileAsync|createDownloadTask|getExternalStorage|ExternalStorage|DCIM|Environment\.DIRECTORY|StorageAccessFramework|requestDirectoryPermissions/u;

    expect(files.filter((file) => forbidden.test(read(file)))).toEqual([]);
  });

  it('only writes below the app-private document and cache directories', () => {
    const external = /Paths\.(?!document|cache|availableDiskSpace)\w+/u;

    expect(files.filter((file) => external.test(read(file)))).toEqual([]);
    expect(read(`${OFFLINE_DIR}/offlineStore.ts`)).toMatch(/Paths\.document/u);
  });

  it('keeps the content key inside the sealed inventory, never in plain storage', () => {
    for (const file of files) {
      expect(read(file)).not.toMatch(/AsyncStorage/u);
    }

    const store = read(`${OFFLINE_DIR}/offlineStore.ts`);

    expect(store).toMatch(/createEncryptedStore\('lectures-offline'/u);
    expect(store).toMatch(/writeInventory/u);
    // The only SecureStore use is the shared device id; the content key goes through the encrypted store.
    expect(
      files.filter((file) => /SecureStore/u.test(read(file)) && !file.endsWith('deviceId.ts')),
    ).toEqual([]);
  });

  it('blocks screen capture while a downloaded lecture is open and has no long-press menus', () => {
    const viewer = read(`${OFFLINE_DIR}/OfflineLectureViewer.tsx`);

    expect(viewer).toMatch(/preventScreenCaptureAsync\(SECURE_KEY\)/u);
    expect(viewer).toMatch(/allowScreenCaptureAsync\(SECURE_KEY\)/u);

    for (const file of [
      `${OFFLINE_DIR}/OfflineLectureViewer.tsx`,
      `${OFFLINE_DIR}/OfflineDownloadButton.tsx`,
    ]) {
      expect(read(file)).not.toMatch(/onLongPress/u);
    }
  });

  it('deletes the decrypted temp copy when the viewer closes', () => {
    const viewer = read(`${OFFLINE_DIR}/OfflineLectureViewer.tsx`);

    expect(viewer).toMatch(/openedRef\.current\?\.release\(\)/u);
    expect(read(`${OFFLINE_DIR}/offlineLibrary.ts`)).toMatch(/release: \(\) => deleteTempFile/u);
  });

  it('wipes every download on sign-out, account switch and device replacement (authSync)', () => {
    const sync = read('src/offline/authSync.ts');

    expect(sync).toMatch(/wipeOfflineLectures\(\)/u);
    expect(sync).toMatch(/startOfflineLectures\(/u);
  });

  it('downloads only through the trusted backend origin and keeps ciphertext on disk', () => {
    const io = read(`${OFFLINE_DIR}/packageIO.ts`);

    expect(io).toMatch(/isTrustedBackendUrl/u);
    // No code path decrypts to the package directory: plaintext only ever goes to the temp file of the open viewer.
    expect(read(`${OFFLINE_DIR}/offlineLibrary.ts`)).toMatch(/newTempFile\(\)/u);
  });
});
