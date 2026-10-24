import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * 2.8.2 could not send the student card: the picker asked for the media-library permission, but the Android manifest
 * blocks storage permissions and declares no media permission, so the request could never be granted (the app showed
 * "no permissions" in the system settings). The gallery uses the system photo picker and needs no permission; only the
 * camera does, and it must be declared.
 */
const ROOT = path.resolve(__dirname, '..', '..');
const read = (file: string) => readFileSync(path.join(ROOT, file), 'utf8');

describe('photo and camera permissions', () => {
  // Every upload spot goes through the shared picker, which is where the permission rules live.
  const source = read('src/features/attachments/services/pickSource.ts');
  const cardPicker = read('src/features/verification/components/VerificationCardImagePicker.tsx');

  it('never gates the album behind a media-library permission', () => {
    expect(source).not.toMatch(
      /requestMediaLibraryPermissionsAsync|getMediaLibraryPermissionsAsync/,
    );
    expect(cardPicker).not.toMatch(
      /requestMediaLibraryPermissionsAsync|getMediaLibraryPermissionsAsync/,
    );
    expect(source).toMatch(/launchImageLibraryAsync/);
  });

  it('asks for the camera permission before opening the camera', () => {
    expect(source).toMatch(/getCameraPermissionsAsync/);
    expect(source).toMatch(/requestCameraPermissionsAsync/);
    expect(source.indexOf('requestCameraPermissionsAsync')).toBeLessThan(
      source.indexOf('launchCameraAsync'),
    );
  });

  it('reports a permanent refusal so the screen can offer the app settings', () => {
    expect(source).toMatch(/permission_denied/);
    expect(cardPicker).toMatch(/Linking\.openSettings/);
    expect(cardPicker).toMatch(/pickFromSource/);
  });

  it('declares the camera in the app config instead of switching it off', () => {
    const config = read('app.config.ts');

    expect(config).toMatch(/cameraPermission:\s*'[^']+'/);
    expect(config).not.toMatch(/cameraPermission:\s*false/);
  });

  it('has a single place that opens the system pickers', () => {
    const walk = (dir: string): string[] =>
      require('node:fs')
        .readdirSync(path.join(ROOT, dir), { withFileTypes: true })
        .flatMap((entry: { name: string; isDirectory: () => boolean }) =>
          entry.isDirectory()
            ? walk(`${dir}/${entry.name}`)
            : /\.(ts|tsx)$/u.test(entry.name) && !dir.includes('__tests__')
              ? [`${dir}/${entry.name}`]
              : [],
        );
    const offenders = walk('src').filter(
      (file) =>
        !file.endsWith('attachments/services/pickSource.ts') &&
        /launchImageLibraryAsync|launchCameraAsync|getDocumentAsync/u.test(read(file)),
    );

    expect(offenders).toEqual([]);
  });
});
