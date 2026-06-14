import * as ImageManipulator from 'expo-image-manipulator';

/** MIME types accepted by OpenAI image APIs. */
const OPENAI_IMAGE_MIMES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);

const UNSUPPORTED_URI_EXTENSIONS = [
  '.heic',
  '.heif',
  '.heics',
  '.tiff',
  '.tif',
  '.bmp',
  '.raw',
  '.dng',
  '.avif',
];

function normalizeMime(mime: string): string {
  return mime.split(';')[0].trim().toLowerCase();
}

export function isOpenAiSupportedMime(mime: string | null | undefined): boolean {
  if (!mime) return false;
  return OPENAI_IMAGE_MIMES.has(normalizeMime(mime));
}

function guessMimeFromUri(uri: string): string | null {
  const lower = uri.split('?')[0].toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/heic';
  return null;
}

function hasUnsupportedUriExtension(uri: string): boolean {
  const lower = uri.split('?')[0].toLowerCase();
  return UNSUPPORTED_URI_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function needsImageNormalization(
  uri: string,
  mimeType?: string | null
): boolean {
  if (uri.startsWith('data:')) {
    const mime = uri.slice(5, uri.indexOf(';'));
    return !isOpenAiSupportedMime(mime);
  }

  if (hasUnsupportedUriExtension(uri)) return true;

  if (mimeType) {
    return !isOpenAiSupportedMime(mimeType);
  }

  const guessed = guessMimeFromUri(uri);
  if (!guessed) return true;
  return !isOpenAiSupportedMime(guessed);
}

/**
 * Converts any picked image (e.g. iPhone HEIC) to JPEG for OpenAI and in-app use.
 * Returns the original URI when already compatible.
 */
export async function normalizeImageForOpenAI(
  uri: string,
  mimeType?: string | null
): Promise<string> {
  if (!needsImageNormalization(uri, mimeType)) {
    return uri;
  }

  const result = await ImageManipulator.manipulateAsync(
    uri,
    [],
    { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG }
  );

  return result.uri;
}
