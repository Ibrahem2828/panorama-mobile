import { requireOptionalNativeModule } from 'expo';
import { Directory, File, Paths } from 'expo-file-system';

type PanoramaPdfNative = {
  getPageCount(uri: string): Promise<number>;
  renderPage(
    uri: string,
    index: number,
    width: number,
    outUri: string,
  ): Promise<{ width: number; height: number }>;
};

/** Android PdfRenderer bridge (modules/panorama-pdf). Null where the native module is not built in. */
const native = requireOptionalNativeModule<PanoramaPdfNative>('PanoramaPdf');

export function isPdfRenderingAvailable(): boolean {
  return native !== null;
}

export type PdfFailure = 'protected' | 'invalid' | 'unavailable';

export class PdfRenderError extends Error {
  readonly failure: PdfFailure;

  constructor(failure: PdfFailure) {
    super(`PDF failure: ${failure}`);
    this.failure = failure;
  }
}

function toFailure(error: unknown): PdfRenderError {
  const code = (error as { code?: string } | null)?.code ?? '';

  return new PdfRenderError(code === 'ERR_PDF_PROTECTED' ? 'protected' : 'invalid');
}

export async function getPdfPageCount(uri: string): Promise<number> {
  if (!native) {
    throw new PdfRenderError('unavailable');
  }

  try {
    return await native.getPageCount(uri);
  } catch (error) {
    throw toFailure(error);
  }
}

/** Where rendered pages of one open document live: the app-private cache, removed when the viewer closes. */
export function createPageDirectory(token: string): Directory {
  return new Directory(Paths.cache, 'pano-open', 'pdf-pages', token);
}

/** Renders one page to a PNG in `directory` (app-private cache) and returns its file URI and size. */
export async function renderPdfPage(
  uri: string,
  index: number,
  width: number,
  directory: Directory,
): Promise<{ uri: string; width: number; height: number }> {
  if (!native) {
    throw new PdfRenderError('unavailable');
  }

  const out = new File(directory, `p${index}.png`);

  try {
    const size = await native.renderPage(uri, index, Math.round(width), out.uri);

    return { uri: out.uri, ...size };
  } catch (error) {
    throw toFailure(error);
  }
}

export function removePageDirectory(directory: Directory): void {
  try {
    if (directory.exists) {
      directory.delete();
    }
  } catch {
    // Private cache; swept again at the next start.
  }
}

/** Removes rendered pages a crash or a missed close left in the private cache. */
export function sweepPdfPages(): void {
  removePageDirectory(new Directory(Paths.cache, 'pano-open', 'pdf-pages'));
}
