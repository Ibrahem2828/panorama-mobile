import {
  CHAT_POLICY,
  DOCUMENT_POLICY,
  documentPickerTypes,
  IMAGE_ONLY_POLICY,
  policyLimitMegabytes,
  PRINT_POLICY,
  validateAgainstPolicy,
} from '../attachmentPolicy';
import { localFileToChatAttachmentForTest } from './helpers';

const file = (name: string, size: number | null = 1000, mimeType: string | null = null) => ({
  name,
  size,
  mimeType,
});

describe('validateAgainstPolicy', () => {
  it('accepts what the spot allows and rejects the rest by type', () => {
    expect(validateAgainstPolicy(file('a.pdf', 10, 'application/pdf'), CHAT_POLICY)).toBeNull();
    expect(validateAgainstPolicy(file('a.jpg', 10, 'image/jpeg'), CHAT_POLICY)).toBeNull();
    expect(validateAgainstPolicy(file('a.docx'), CHAT_POLICY)).toBe('type');
    expect(validateAgainstPolicy(file('a.docx'), PRINT_POLICY)).toBeNull();
    expect(validateAgainstPolicy(file('a.pdf'), IMAGE_ONLY_POLICY)).toBe('type');
    expect(validateAgainstPolicy(file('noext'), DOCUMENT_POLICY)).toBe('type');
  });

  it('trusts the extension AND the declared mime type', () => {
    expect(validateAgainstPolicy(file('a.jpg', 10, 'application/zip'), DOCUMENT_POLICY)).toBe(
      'type',
    );
    expect(
      validateAgainstPolicy(file('a.jpg', 10, 'application/octet-stream'), DOCUMENT_POLICY),
    ).toBeNull();
  });

  it('keeps each spot at its own size limit', () => {
    expect(validateAgainstPolicy(file('a.png', 0), DOCUMENT_POLICY)).toBe('empty');
    expect(validateAgainstPolicy(file('a.png', 8 * 1024 * 1024 + 1), IMAGE_ONLY_POLICY)).toBe(
      'size',
    );
    expect(validateAgainstPolicy(file('a.png', 8 * 1024 * 1024), IMAGE_ONLY_POLICY)).toBeNull();
    expect(validateAgainstPolicy(file('a.png', 25 * 1024 * 1024), DOCUMENT_POLICY)).toBeNull();
    expect(validateAgainstPolicy(file('a.png', null), DOCUMENT_POLICY)).toBeNull();
  });
});

describe('policy helpers', () => {
  it('offers the document picker the spot’s mime types plus images when images are allowed', () => {
    expect(documentPickerTypes(CHAT_POLICY)).toEqual(
      expect.arrayContaining(['application/pdf', 'image/*']),
    );
    expect(documentPickerTypes(PRINT_POLICY)).toContain(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
  });

  it('reports the limit in megabytes', () => {
    expect(policyLimitMegabytes(DOCUMENT_POLICY)).toBe(25);
    expect(policyLimitMegabytes(IMAGE_ONLY_POLICY)).toBe(8);
  });

  it('only the camera and album are offered for screenshots', () => {
    expect(IMAGE_ONLY_POLICY.sources).toEqual(['album', 'camera']);
    expect(CHAT_POLICY.sources).toEqual(['album', 'camera', 'document']);
  });
});

describe('chat conversion', () => {
  it('treats images as photos and everything else as documents', () => {
    expect(
      localFileToChatAttachmentForTest({ uri: 'u', name: 'a.png', size: 5, mimeType: 'image/png' })
        .kind,
    ).toBe('image');
    expect(
      localFileToChatAttachmentForTest({ uri: 'u', name: 'a.pdf', size: null, mimeType: null }),
    ).toMatchObject({
      kind: 'file',
      size: 0,
      mimeType: 'application/pdf',
    });
  });
});
