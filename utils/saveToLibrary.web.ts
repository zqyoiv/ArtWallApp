import { Alert } from 'react-native';

/** Web: no photo library — trigger a browser download instead. */
export async function ensurePhotoLibraryWriteAccess(): Promise<boolean> {
  return true;
}

export async function saveImageToCameraRoll(localUri: string): Promise<void> {
  if (typeof document === 'undefined') {
    Alert.alert('Save unavailable', 'Saving is only available in a browser.');
    return;
  }

  const link = document.createElement('a');
  link.href = localUri;
  link.download = `artwall-preview-${Date.now()}.png`;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
