import { apiClient, endpoints } from '../../../api';
import { useAuthStore } from '../../auth/store';
import { annotationKind, type DocRef } from '../types';
import type { ServerItem, SyncPayload, SyncResponse } from './model';

const KINDS = new Set(['highlight', 'underline', 'pen', 'note']);

function authToken(): string | null {
  return useAuthStore.getState().accessToken;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseItem(value: unknown): ServerItem | null {
  if (
    !isRecord(value) ||
    typeof value.client_id !== 'string' ||
    typeof value.page_number !== 'number' ||
    typeof value.kind !== 'string' ||
    !KINDS.has(value.kind) ||
    typeof value.version !== 'number' ||
    !isRecord(value.data)
  ) {
    return null;
  }

  return {
    client_id: value.client_id,
    page_number: value.page_number,
    kind: value.kind as ServerItem['kind'],
    color: typeof value.color === 'string' ? value.color : '',
    width: typeof value.width === 'number' ? value.width : 0,
    data: value.data as ServerItem['data'],
    version: value.version,
    deleted: value.deleted === true,
  };
}

function parseItems(value: unknown): ServerItem[] {
  return Array.isArray(value)
    ? value.map(parseItem).filter((item): item is ServerItem => item !== null)
    : [];
}

export async function fetchAnnotations(
  doc: DocRef,
  since: number,
): Promise<{ revision: number; items: ServerItem[] }> {
  const data = await apiClient.get<unknown>(
    endpoints.annotations.list(annotationKind(doc), doc.id),
    {
      authToken: authToken(),
      query: { since },
    },
  );
  const record = isRecord(data) ? data : {};

  return {
    revision: typeof record.revision === 'number' ? record.revision : 0,
    items: parseItems(record.items),
  };
}

export async function syncAnnotations(doc: DocRef, payload: SyncPayload): Promise<SyncResponse> {
  const data = await apiClient.post<unknown, SyncPayload>(
    endpoints.annotations.sync(annotationKind(doc), doc.id),
    payload,
    { authToken: authToken() },
  );
  const record = isRecord(data) ? data : {};

  return {
    revision: typeof record.revision === 'number' ? record.revision : payload.base_revision,
    conflicts: parseItems(record.conflicts),
    changes: parseItems(record.changes),
  };
}

export type MyNote = {
  source: 'lecture_note' | 'annotation';
  target_type: 'lecture' | 'file';
  target_id: number;
  title: string;
  page_number: number | null;
  text: string;
  is_bookmark: boolean;
  updated_at: string;
};

export async function searchMyNotes(query: string): Promise<MyNote[]> {
  const data = await apiClient.get<unknown>(endpoints.annotations.myNotes, {
    authToken: authToken(),
    query: { q: query },
  });

  return Array.isArray(data)
    ? data.filter(
        (row): row is MyNote =>
          isRecord(row) && typeof row.target_id === 'number' && typeof row.text === 'string',
      )
    : [];
}
