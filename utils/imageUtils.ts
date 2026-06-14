import { Image } from 'react-native';
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
