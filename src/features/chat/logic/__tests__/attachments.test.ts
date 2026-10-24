import { MAX_ATTACHMENT_BYTES } from '../../types';
import {
  fileExtension,
  toChatAttachment,
  toChatDocument,
  validateChatAttachment,
} from '../attachments';

describe('validateChatAttachment', () => {
  const ok = { name: 'a.jpg', mimeType: 'image/jpeg', size: 1000, kind: 'image' as const };

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

  it('accepts PDFs as documents and rejects images or Office files sent as documents', () => {
    const pdf = { name: 'notes.pdf', mimeType: 'application/pdf', size: 10, kind: 'file' as const };

    expect(validateChatAttachment(pdf)).toBeNull();
    expect(validateChatAttachment({ ...pdf, name: 'notes.docx' })).toBe('type');
    expect(validateChatAttachment({ ...pdf, name: 'a.jpg', mimeType: 'image/jpeg' })).toBe('type');
    expect(validateChatAttachment({ ...ok, name: 'a.pdf', mimeType: 'application/pdf' })).toBe(
      'type',
    );
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
    ).toEqual({ uri: 'file:///x', name: 'x.png', mimeType: 'image/png', size: 5, kind: 'image' });
  });

  it('invents a safe name and defaults to jpeg when the picker gives none', () => {
    expect(toChatAttachment({ uri: 'file:///x' }, 123)).toEqual({
      uri: 'file:///x',
      name: 'photo-123.jpg',
      mimeType: 'image/jpeg',
      size: 0,
      kind: 'image',
    });
    expect(toChatAttachment({ uri: 'u', fileName: 'noext', mimeType: 'image/webp' }, 1).name).toBe(
      'photo-1.webp',
    );
  });

  it('toChatDocument defaults to a PDF', () => {
    expect(toChatDocument({ uri: 'file:///d', name: 'x.pdf', size: 3 })).toEqual({
      uri: 'file:///d',
      name: 'x.pdf',
      mimeType: 'application/pdf',
      size: 3,
      kind: 'file',
    });
  });

  it('fileExtension is lowercase and empty without a dot', () => {
    expect(fileExtension('A.B.JPG')).toBe('jpg');
    expect(fileExtension('plain')).toBe('');
  });
});
