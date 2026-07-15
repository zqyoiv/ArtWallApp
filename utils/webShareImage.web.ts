/**
 * Web Share helpers for iOS Safari.
 * Share MUST run inside a real DOM click handler (not after long async / RN press).
 */

function isShareCancellation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const name = 'name' in error ? String((error as { name?: string }).name) : '';
  const message = 'message' in error ? String((error as { message?: string }).message) : '';
  return (
    name === 'AbortError' ||
    name === 'NotAllowedError' ||
    /cancel/i.test(message)
  );
}

export function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return iOS && /WebKit/.test(ua);
}

export function isWebShareAvailable(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof window !== 'undefined' &&
    window.isSecureContext === true
  );
}

export async function dataUriToImageFile(dataUri: string): Promise<File> {
  const response = await fetch(dataUri);
  if (!response.ok) {
    throw new Error('Could not read the preview image.');
  }
  const blob = await response.blob();
  // Always force image/png — empty blob.type breaks canShare on iOS.
  const file = new File([blob], `artwall-preview-${Date.now()}.png`, {
    type: 'image/png',
    lastModified: Date.now(),
  });
  return file;
}

/** @deprecated use dataUriToImageFile */
export async function uriToImageFile(uri: string, _filename?: string): Promise<File> {
  return dataUriToImageFile(uri);
}

export function canShareImageFile(file: File): boolean {
  if (!isWebShareAvailable()) return false;
  if (typeof navigator.canShare !== 'function') return true;
  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

/**
 * Call ONLY from a synchronous DOM click/tap handler.
 * Do not await anything before this call.
 */
export function shareImageFileNow(file: File): Promise<void> {
  if (!isWebShareAvailable()) {
    return Promise.reject(
      new Error(
        'Share needs HTTPS (or localhost). Open the site over https://, not http://IP.'
      )
    );
  }

  const payload: ShareData = { files: [file] };
  if (typeof navigator.canShare === 'function') {
    try {
      if (!navigator.canShare(payload)) {
        return Promise.reject(new Error('This browser cannot share image files.'));
      }
    } catch {
      // continue and let share() throw if needed
    }
  }

  return navigator.share(payload).catch((error: unknown) => {
    if (isShareCancellation(error)) {
      throw new Error('SAVE_CANCELLED');
    }
    throw error;
  });
}

/** @deprecated use shareImageFileNow from a DOM click handler */
export async function shareImageFile(file: File): Promise<void> {
  return shareImageFileNow(file);
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
  const file = await dataUriToImageFile(uri);
  if (canShareImageFile(file)) {
    await shareImageFileNow(file);
    return 'shared';
  }
  await downloadImageFile(file);
  return 'downloaded';
}
