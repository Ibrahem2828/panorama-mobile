import { MAX_ATTACHMENT_BYTES } from '../../types';
import { fileExtension, toChatAttachment, validateChatAttachment } from '../attachments';

describe('validateChatAttachment', () => {
  const ok = { name: 'a.jpg', mimeType: 'image/jpeg', size: 1000 };

  it('accepts the image types the backend accepts', () => {
    expect(validateChatAttachment(ok)).toBeNull();
    expect(validateChatAttachment({ ...ok, name: 'a.PNG', mimeType: 'image/png' })).toBeNull();
    expect(validateChatAttachment({ ...ok, name: 'a.webp', mimeType: 'image/webp' })).toBeNull();
  });

  it('rejects other types by extension or mime', () => {
    expect(validateChatAttachment({ ...ok, name: 'a.gif', mimeType: 'image/gif' })).toBe('type');
    expect(validateChatAttachment({ ...ok, mimeType: 'application/zip' })).toBe('type');
    expect(validateChatAttachment({ ...ok, name: 'noext' })).toBe('type');
  });

  it('rejects empty and oversized files', () => {
    expect(validateChatAttachment({ ...ok, size: 0 })).toBe('empty');
    expect(validateChatAttachment({ ...ok, size: MAX_ATTACHMENT_BYTES + 1 })).toBe('size');
    expect(validateChatAttachment({ ...ok, size: MAX_ATTACHMENT_BYTES })).toBeNull();
  });
});

describe('toChatAttachment', () => {
  it('keeps picker metadata', () => {
    expect(
      toChatAttachment({ uri: 'file:///x', fileName: 'x.png', mimeType: 'image/png', fileSize: 5 }),
    ).toEqual({ uri: 'file:///x', name: 'x.png', mimeType: 'image/png', size: 5 });
  });

  it('invents a safe name and defaults to jpeg when the picker gives none', () => {
    expect(toChatAttachment({ uri: 'file:///x' }, 123)).toEqual({
      uri: 'file:///x',
      name: 'photo-123.jpg',
      mimeType: 'image/jpeg',
      size: 0,
    });
    expect(toChatAttachment({ uri: 'u', fileName: 'noext', mimeType: 'image/webp' }, 1).name).toBe(
      'photo-1.webp',
    );
  });

  it('fileExtension is lowercase and empty without a dot', () => {
    expect(fileExtension('A.B.JPG')).toBe('jpg');
    expect(fileExtension('plain')).toBe('');
  });
});
