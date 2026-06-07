import * as MediaLibrary from 'expo-media-library';
import { Alert, Platform } from 'react-native';

export async function ensurePhotoLibraryWriteAccess(): Promise<boolean> {
  const writeOnly = Platform.OS === 'ios';
  const { status } = await MediaLibrary.requestPermissionsAsync(writeOnly);
  if (status === 'granted') {
    return true;
  }
  Alert.alert(
    'Permission required',
    'Allow ArtWall to add photos to your library so we can save your preview.'
  );
  return false;
}

export async function saveImageToCameraRoll(localUri: string): Promise<void> {
  const allowed = await ensurePhotoLibraryWriteAccess();
  if (!allowed) {
    return;
  }
  await MediaLibrary.saveToLibraryAsync(localUri);
}
