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
  const picker = read('src/features/verification/components/VerificationCardImagePicker.tsx');

  it('never gates the gallery behind a media-library permission', () => {
    expect(picker).not.toMatch(
      /requestMediaLibraryPermissionsAsync|getMediaLibraryPermissionsAsync/,
    );
    expect(picker).toMatch(/launchImageLibraryAsync/);
  });

  it('asks for the camera permission before opening the camera, and offers the app settings when refused', () => {
    expect(picker).toMatch(/requestCameraPermissionsAsync/);
    expect(picker).toMatch(/launchCameraAsync/);
    expect(picker).toMatch(/Linking\.openSettings/);
  });

  it('declares the camera in the app config instead of switching it off', () => {
    const config = read('app.config.ts');

    expect(config).toMatch(/cameraPermission:\s*'[^']+'/);
    expect(config).not.toMatch(/cameraPermission:\s*false/);
  });
});
