import {
  extractResults,
  parseLecture,
  parseLectures,
  parseNote,
  parseNotes,
  parsePageText,
  parseProcessingStatus,
  parseViewerSession,
} from '../services/parsers';

describe('extractResults', () => {
  it('reads a DRF page', () => {
    expect(extractResults({ count: 2, next: 'https://x/?page=2', results: [1, 2] })).toEqual({
      results: [1, 2],
      hasNext: true,
    });
    expect(extractResults({ results: [], next: null }).hasNext).toBe(false);
  });

  it('reads a bare array and tolerates junk', () => {
    expect(extractResults([1])).toEqual({ results: [1], hasNext: false });
    expect(extractResults(null)).toEqual({ results: [], hasNext: false });
    expect(extractResults('x')).toEqual({ results: [], hasNext: false });
  });
});

describe('parseLecture', () => {
  it('normalises a full record', () => {
    expect(
      parseLecture({
        id: 4,
        subject: 9,
        subject_name: ' Anatomy ',
        title: ' Heart ',
        description: '',
        status: 'ready',
        page_count: 12,
        is_published: true,
        can_view: true,
        updated_at: '2026-01-01T00:00:00Z',
      }),
    ).toMatchObject({
      id: 4,
      subject: 9,
      subject_name: 'Anatomy',
      title: 'Heart',
      description: null,
      status: 'ready',
      page_count: 12,
      can_view: true,
    });
  });

  it('keeps a null subject null and flags the lecture as general', () => {
    const lecture = parseLecture({
      id: 8,
      subject: null,
      subject_name: null,
      faculty: 3,
      faculty_name: 'Medicine',
    });
    expect(lecture?.subject).toBeNull();
    expect(lecture).toMatchObject({ is_general: true, faculty: 3, faculty_name: 'Medicine' });
    expect(parseLecture({ id: 9, subject: 5 })).toMatchObject({ subject: 5, is_general: false });
  });

  it('survives missing fields and unknown statuses', () => {
    const lecture = parseLecture({ id: '7', status: 'brand-new' });
    expect(lecture).toMatchObject({ id: 7, title: null, page_count: 0, status: 'brand-new' });
    expect(lecture?.can_view).toBe(true);
  });

  it('rejects rows without a usable id', () => {
    expect(parseLecture({})).toBeNull();
    expect(parseLecture({ id: 'abc' })).toBeNull();
    expect(parseLecture(null)).toBeNull();
  });

  it('drops invalid rows from a list', () => {
    expect(parseLectures({ results: [{ id: 1 }, null, { id: 2 }] }).map((item) => item.id)).toEqual(
      [1, 2],
    );
  });
});

describe('parseNote', () => {
  it('normalises the serializer fields', () => {
    expect(
      parseNote({
        id: 3,
        page_number: 5,
        content: 'hello',
        version: 2,
        is_bookmark: true,
        is_favorite: false,
        created_at: 'a',
        updated_at: 'b',
      }),
    ).toEqual({
      id: 3,
      page_number: 5,
      content: 'hello',
      version: 2,
      is_bookmark: true,
      is_favorite: false,
      created_at: 'a',
      updated_at: 'b',
    });
  });

  it('defaults version and keeps general notes page-less', () => {
    expect(parseNote({ id: 1, content: 'x', page_number: null })).toMatchObject({
      page_number: null,
      version: 1,
      is_bookmark: false,
    });
  });

  it('parses bare arrays and skips bad rows', () => {
    expect(parseNotes([{ id: 1, content: 'a' }, { content: 'no id' }])).toHaveLength(1);
  });
});

describe('viewer payloads', () => {
  it('requires a session token', () => {
    expect(
      parseViewerSession({ session_token: 'abc', expires_at: '2030-01-01T00:00:00Z' }),
    ).toEqual({
      session_token: 'abc',
      expires_at: '2030-01-01T00:00:00Z',
    });
    expect(() => parseViewerSession({})).toThrow();
    expect(() => parseViewerSession({ session_token: '' })).toThrow();
    expect(() => parseViewerSession(null)).toThrow();
  });

  it('parses processing status', () => {
    expect(parseProcessingStatus({ status: 'rendering', page_count: 3, is_ready: false })).toEqual({
      status: 'rendering',
      page_count: 3,
      is_ready: false,
    });
    expect(parseProcessingStatus({ status: 'ready' }).is_ready).toBe(true);
    expect(parseProcessingStatus(undefined).status).toBe('unknown');
  });

  it('parses page text with a fallback page number', () => {
    expect(parsePageText({ lecture_id: 1, page_number: 2, text: 'hi' }, 9)).toEqual({
      lecture_id: 1,
      page_number: 2,
      text: 'hi',
    });
    expect(parsePageText(null, 9)).toEqual({ lecture_id: 0, page_number: 9, text: '' });
  });
});
