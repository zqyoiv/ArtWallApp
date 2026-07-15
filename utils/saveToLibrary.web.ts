/**
 * Web cannot write to the iOS Photos library directly.
 * Prefer the Web Share sheet (Save Image → Photos on iPhone).
 */

import {
  canShareImageFile,
  downloadImageFile,
  shareImageFile,
  uriToImageFile,
} from './webShareImage';

export async function ensurePhotoLibraryWriteAccess(): Promise<boolean> {
  return true;
}

export async function saveImageToCameraRoll(
  localUri: string
): Promise<'saved' | 'shared' | 'downloaded'> {
  if (typeof document === 'undefined') {
    throw new Error('Saving is only available in a browser.');
  }

  const file = await uriToImageFile(localUri);
  if (canShareImageFile(file)) {
    await shareImageFile(file);
    return 'shared';
  }

  await downloadImageFile(file);
  return 'downloaded';
}

/** Share a prebuilt file immediately (keeps the iOS user-gesture chain intact). */
export async function savePreparedImageFile(
  file: File
): Promise<'shared' | 'downloaded'> {
  if (canShareImageFile(file)) {
    await shareImageFile(file);
    return 'shared';
  }
  await downloadImageFile(file);
  return 'downloaded';
}
