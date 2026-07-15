/**
 * Web-only helpers. Native builds use this stub.
 */

type ImageFile = { readonly name: string; readonly type: string };

export function isIosSafari(): boolean {
  return false;
}

export function isWebShareAvailable(): boolean {
  return false;
}

export async function dataUriToImageFile(_uri: string): Promise<ImageFile> {
  throw new Error('Web Share is only available on web.');
}

export async function uriToImageFile(_uri: string, _filename?: string): Promise<ImageFile> {
  throw new Error('Web Share is only available on web.');
}

export function canShareImageFile(_file: ImageFile): boolean {
  return false;
}

export function shareImageFileNow(_file: ImageFile): Promise<void> {
  return Promise.reject(new Error('Web Share is only available on web.'));
}

export async function shareImageFile(_file: ImageFile): Promise<void> {
  throw new Error('Web Share is only available on web.');
}

export async function downloadImageFile(_file: ImageFile): Promise<void> {
  throw new Error('Download is only available on web.');
}

export async function shareOrDownloadImageUri(
  _uri: string
): Promise<'shared' | 'downloaded'> {
  throw new Error('Web Share is only available on web.');
}
