import { apiClient, endpoints, generateIdempotencyKey, getAppClientHeaders } from '../../../api';
import { buildApiUrl } from '../../../config/env';
import { useAuthStore } from '../../auth/store';
import type {
  Lecture,
  LectureId,
  LectureNote,
  PageKind,
  PageText,
  ProcessingStatus,
  ViewerImageSource,
  ViewerSessionPayload,
} from '../types';
import {
  extractResults,
  parseLecture,
  parseLectures,
  parseNote,
  parseNotes,
  parsePageText,
  parseProcessingStatus,
  parseViewerSession,
} from './parsers';

/** Backend `max_page_size`. */
const PAGE_SIZE = 100;
const MAX_PAGES = 20;

function authToken(): string | null {
  return useAuthStore.getState().accessToken;
}

/**
 * Every lecture the student may see (`GET lectures/`: only ready + published lectures of the student's
 * major/year/semester). The endpoint only paginates, so every page is fetched (bounded) and search/subject filters
 * run client-side on the complete list.
 */
export async function fetchAllLectures(): Promise<Lecture[]> {
  const out: Lecture[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const data = await apiClient.get<unknown>(endpoints.lectures.list, {
      authToken: authToken(),
      query: { page, page_size: PAGE_SIZE },
    });
    out.push(...parseLectures(data));
    if (!extractResults(data).hasNext) break;
  }
  return out;
}

export async function fetchLecture(lectureId: LectureId): Promise<Lecture> {
  const data = await apiClient.get<unknown>(endpoints.lectures.detail(lectureId), {
    authToken: authToken(),
  });
  const lecture = parseLecture(data);
  if (!lecture) throw new Error('INVALID_LECTURE');
  return lecture;
}

export async function fetchProcessingStatus(lectureId: LectureId): Promise<ProcessingStatus> {
  const data = await apiClient.get<unknown>(endpoints.lectures.processingStatus(lectureId), {
    authToken: authToken(),
  });
  return parseProcessingStatus(data);
}

// --- Viewer ----------------------------------------------------------------------------------------------------------

export async function createViewerSession(lectureId: LectureId): Promise<ViewerSessionPayload> {
  const data = await apiClient.post<unknown>(
    endpoints.lectures.viewerSession(lectureId),
    undefined,
    {
      authToken: authToken(),
    },
  );
  return parseViewerSession(data);
}

export async function fetchPageText(
  lectureId: LectureId,
  page: number,
  viewerToken: string,
): Promise<PageText> {
  const data = await apiClient.get<unknown>(endpoints.lectures.pageText(lectureId, page), {
    authToken: authToken(),
    headers: { 'X-Viewer-Session': viewerToken },
  });
  return parsePageText(data, page);
}

/**
 * Source for the native `Image`: the page is streamed and decoded natively (never written to shared storage and never
 * passed through JS), authenticated by the access token plus the short-lived `X-Viewer-Session` header.
 */
export function buildPageImageSource(
  lectureId: LectureId,
  kind: PageKind,
  page: number,
  viewerToken: string,
): ViewerImageSource {
  const path =
    kind === 'thumbnail'
      ? endpoints.lectures.pageThumbnail(lectureId, page)
      : endpoints.lectures.pageImage(lectureId, page);
  const token = authToken();
  return {
    uri: buildApiUrl(path),
    headers: {
      ...getAppClientHeaders(),
      Accept: 'image/*',
      'X-Viewer-Session': viewerToken,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
}

// --- Notes -----------------------------------------------------------------------------------------------------------

export async function fetchNotes(lectureId: LectureId): Promise<LectureNote[]> {
  const data = await apiClient.get<unknown>(endpoints.lectures.notes(lectureId), {
    authToken: authToken(),
  });
  return parseNotes(data);
}

export async function createNote(
  lectureId: LectureId,
  input: {
    content: string;
    page_number: number | null;
    is_bookmark?: boolean;
    note_type?: string;
  },
  idempotencyKey: string = generateIdempotencyKey(),
): Promise<LectureNote> {
  const data = await apiClient.post<unknown, typeof input>(
    endpoints.lectures.notes(lectureId),
    input,
    {
      authToken: authToken(),
      idempotencyKey,
    },
  );
  const note = parseNote(data);
  if (!note) throw new Error('INVALID_NOTE');
  return note;
}

/** PATCH with the optimistic-locking `version`; a stale version answers 409. */
export async function updateNote(
  lectureId: LectureId,
  note: Pick<LectureNote, 'id' | 'version'>,
  patch: { content?: string; is_favorite?: boolean },
): Promise<LectureNote> {
  const data = await apiClient.patch<unknown, typeof patch & { version: number }>(
    endpoints.lectures.noteDetail(lectureId, note.id),
    { ...patch, version: note.version },
    { authToken: authToken() },
  );
  const saved = parseNote(data);
  if (!saved) throw new Error('INVALID_NOTE');
  return saved;
}

export async function deleteNote(lectureId: LectureId, noteId: LectureNote['id']): Promise<void> {
  await apiClient.delete<unknown>(endpoints.lectures.noteDetail(lectureId, noteId), {
    authToken: authToken(),
  });
}
