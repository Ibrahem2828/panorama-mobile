/** A document the unified viewer can open: a lecture or a library file (both are served as protected page images). */
export type DocRef = { kind: 'lecture' | 'file'; id: string | number };

export function asDocRef(value: DocRef | string | number): DocRef {
  return typeof value === 'object' ? value : { kind: 'lecture', id: value };
}

export function docKey(doc: DocRef): string {
  return `${doc.kind}:${doc.id}`;
}

/** Path segment of the annotation / notes endpoints. */
export function annotationKind(doc: DocRef): 'lectures' | 'files' {
  return doc.kind === 'lecture' ? 'lectures' : 'files';
}
