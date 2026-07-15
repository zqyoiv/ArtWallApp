/**
 * Web image save/share helpers.
 * iOS Safari only allows the share sheet during a direct user gesture —
 * avoid setState / Alert before calling share().
 */

function isShareCancellation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const name = 'name' in error ? String((error as { name?: string }).name) : '';
  return name === 'AbortError' || name === 'NotAllowedError';
}

export function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const webkit = /WebKit/.test(ua);
  return iOS && webkit;
}

export async function uriToImageFile(uri: string, filename?: string): Promise<File> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('Could not read the preview image.');
  }
  const blob = await response.blob();
  const mime = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/png';
  const ext = mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : 'png';
  const name = filename ?? `artwall-preview-${Date.now()}.${ext}`;
  return new File([blob], name, { type: mime });
}

export function canShareImageFile(file: File): boolean {
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  if (!nav || typeof nav.share !== 'function') return false;
  if (typeof nav.canShare !== 'function') {
    return typeof File !== 'undefined';
  }
  try {
    return nav.canShare({ files: [file] });
  } catch {
    return false;
  }
}

/**
 * Opens the system share sheet. Must be called directly from a user gesture
 * (button press) with as little async work beforehand as possible.
 */
export async function shareImageFile(file: File): Promise<void> {
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  if (!nav || typeof nav.share !== 'function') {
    throw new Error('Web Share is not available in this browser.');
  }

  try {
    // files-only is the most reliable way to get "Save Image" on iOS Safari.
    await nav.share({ files: [file] });
  } catch (error) {
    if (isShareCancellation(error)) {
      throw new Error('SAVE_CANCELLED');
    }
    throw error;
  }
}

export async function downloadImageFile(file: File): Promise<void> {
  if (typeof document === 'undefined') {
    throw new Error('Download is only available in a browser.');
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = file.name;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
  }
}

export async function shareOrDownloadImageUri(
  uri: string
): Promise<'shared' | 'downloaded'> {
  const file = await uriToImageFile(uri);
  if (canShareImageFile(file)) {
    await shareImageFile(file);
    return 'shared';
  }
  await downloadImageFile(file);
  return 'downloaded';
}
