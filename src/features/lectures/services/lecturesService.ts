import { apiClient, endpoints, generateIdempotencyKey, getAppClientHeaders } from '../../../api';
import { buildApiUrl } from '../../../config/env';
import { useAuthStore } from '../../auth/store';
import { asDocRef, type DocRef } from '../../viewer/types';
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

export async function fetchProcessingStatus(target: LectureId | DocRef): Promise<ProcessingStatus> {
  const doc = asDocRef(target);

  if (doc.kind === 'file') {
    const data = await apiClient.get<{ status?: string; page_count?: number; ready?: boolean }>(
      endpoints.fileViewer.manifest(doc.id),
      { authToken: authToken() },
    );

    return {
      status: typeof data.status === 'string' ? data.status : 'pending',
      page_count: typeof data.page_count === 'number' ? data.page_count : 0,
      is_ready: data.ready === true,
    };
  }

  const data = await apiClient.get<unknown>(endpoints.lectures.processingStatus(doc.id), {
    authToken: authToken(),
  });
  return parseProcessingStatus(data);
}

// --- Viewer ----------------------------------------------------------------------------------------------------------

export async function createViewerSession(
  target: LectureId | DocRef,
): Promise<ViewerSessionPayload> {
  const doc = asDocRef(target);
  const data = await apiClient.post<unknown>(
    doc.kind === 'file'
      ? endpoints.fileViewer.session(doc.id)
      : endpoints.lectures.viewerSession(doc.id),
    undefined,
    {
      authToken: authToken(),
    },
  );
  return parseViewerSession(data);
}

export async function fetchPageText(
  target: LectureId | DocRef,
  page: number,
  viewerToken: string,
): Promise<PageText> {
  const doc = asDocRef(target);
  const data = await apiClient.get<unknown>(
    doc.kind === 'file'
      ? endpoints.fileViewer.pageText(doc.id, page)
      : endpoints.lectures.pageText(doc.id, page),
    {
      authToken: authToken(),
      headers: { 'X-Viewer-Session': viewerToken },
    },
  );
  return parsePageText(data, page);
}

/**
 * Source for the native `Image`: the page is streamed and decoded natively (never written to shared storage and never
 * passed through JS), authenticated by the access token plus the short-lived `X-Viewer-Session` header.
 */
export function buildPageImageSource(
  target: LectureId | DocRef,
  kind: PageKind,
  page: number,
  viewerToken: string,
): ViewerImageSource {
  const doc = asDocRef(target);
  const endpoint = doc.kind === 'file' ? endpoints.fileViewer : endpoints.lectures;
  const path =
    kind === 'thumbnail' ? endpoint.pageThumbnail(doc.id, page) : endpoint.pageImage(doc.id, page);
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
