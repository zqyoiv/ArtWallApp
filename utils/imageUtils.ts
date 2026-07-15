import { Image, ImageSourcePropType, Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { normalizeImageForOpenAI } from './normalizeImage';

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      if (!base64) {
        reject(new Error('Could not read image data'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Could not read image data'));
    reader.readAsDataURL(blob);
  });
}

export async function uriToDataUrl(uri: string): Promise<string> {
  const normalizedUri = await normalizeImageForOpenAI(uri);
  if (normalizedUri.startsWith('data:')) return normalizedUri;

  const response = await fetch(normalizedUri);
  const blob = await response.blob();
  const mime = blob.type || 'image/jpeg';
  const base64 = await blobToBase64(blob);
  return `data:${mime};base64,${base64}`;
}

export function getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error)
    );
  });
}

/**
 * Resolve a bundled asset (from require()) to a usable URI on native and web.
 * Image.resolveAssetSource is unavailable on react-native-web.
 */
export async function resolveAssetUri(
  source: ImageSourcePropType | string | number
): Promise<string | null> {
  if (typeof source === 'string') return source;

  if (source && typeof source === 'object' && !Array.isArray(source) && 'uri' in source) {
    const uri = (source as { uri?: string | null }).uri;
    if (uri) return uri;
  }

  // Metro / webpack web often returns the URL string from require()
  if (Platform.OS === 'web' && typeof source === 'object' && source != null) {
    const maybeUrl = source as { default?: unknown; uri?: string };
    if (typeof maybeUrl.default === 'string') return maybeUrl.default;
    if (typeof maybeUrl.uri === 'string') return maybeUrl.uri;
  }

  try {
    const asset = Asset.fromModule(source as number);
    if (!asset.localUri) {
      await asset.downloadAsync();
    }
    return asset.localUri ?? asset.uri ?? null;
  } catch {
    // fall through
  }

  if (typeof Image.resolveAssetSource === 'function') {
    try {
      const resolved = Image.resolveAssetSource(source);
      return resolved?.uri ?? null;
    } catch {
      return null;
    }
  }

  return null;
}
