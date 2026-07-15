/**
 * Web cannot write to the iOS Photos library directly.
 * On iPhone Safari we use the Web Share API so the user can tap "Save Image".
 * Elsewhere we fall back to a file download.
 */

export async function ensurePhotoLibraryWriteAccess(): Promise<boolean> {
  return true;
}

async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('Could not read the preview image.');
  }
  return response.blob();
}

function isShareCancellation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const name = 'name' in error ? String((error as { name?: string }).name) : '';
  return name === 'AbortError' || name === 'NotAllowedError';
}

export type WebSaveResult = 'shared' | 'downloaded';

/**
 * Returns how the image was offered to the user (for UI messaging).
 */
export async function saveImageToCameraRoll(
  localUri: string
): Promise<'saved' | 'shared' | 'downloaded'> {
  if (typeof document === 'undefined') {
    throw new Error('Saving is only available in a browser.');
  }

  const blob = await uriToBlob(localUri);
  const mime = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/png';
  const ext = mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : 'png';
  const file = new File([blob], `artwall-preview-${Date.now()}.${ext}`, { type: mime });

  const nav = typeof navigator !== 'undefined' ? navigator : null;
  const canShareFiles =
    !!nav &&
    typeof nav.canShare === 'function' &&
    typeof nav.share === 'function' &&
    nav.canShare({ files: [file] });

  if (canShareFiles) {
    try {
      await nav!.share({
        files: [file],
        title: 'ArtWall Preview',
      });
      return 'shared';
    } catch (error) {
      if (isShareCancellation(error)) {
        throw new Error('SAVE_CANCELLED');
      }
      // Fall through to download if share fails for another reason.
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = file.name;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  return 'downloaded';
}
