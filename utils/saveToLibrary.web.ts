/**
 * Web cannot write to the iOS Photos library directly.
 * Prefer the Web Share sheet (Save Image → Photos on iPhone).
 */

import {
  canShareImageFile,
  dataUriToImageFile,
  downloadImageFile,
  shareImageFileNow,
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

  const file = await dataUriToImageFile(localUri);
  if (canShareImageFile(file)) {
    await shareImageFileNow(file);
    return 'shared';
  }

  await downloadImageFile(file);
  return 'downloaded';
}

export async function savePreparedImageFile(
  file: File
): Promise<'shared' | 'downloaded'> {
  if (canShareImageFile(file)) {
    await shareImageFileNow(file);
    return 'shared';
  }
  await downloadImageFile(file);
  return 'downloaded';
}
