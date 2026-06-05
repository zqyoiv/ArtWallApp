// utils/openai.ts
// Room cleanup using OpenAI GPT-Image-1 inpainting

import { Platform } from 'react-native';

const OPENAI_API_URL = 'https://api.openai.com/v1/images/edits';

/** Landscape output size for gpt-image-1 (1536×1024, widescreen). */
const CLEANUP_IMAGE_SIZE = '1536x1024';

const CLEANUP_PROMPT = `Remove all clutter, loose objects, cables, boxes, and miscellaneous household items from this room.
Also remove every item on the walls: paintings, framed art, posters, prints, wall decor, mirrors, shelves with objects, and any other wall-mounted visuals.
Leave all wall surfaces completely blank and empty—plain painted or textured walls only, with no artwork or decorations remaining.
Preserve furniture, flooring, windows, doors, architectural elements, lighting, colors, shadows, and room perspective.
Do not redesign the room or change its layout.
The output must be a single widescreen 16:9 landscape photograph (horizontal, cinematic aspect ratio). Compose and crop the scene to fill a 16:9 frame edge-to-edge—no square, portrait, or letterboxed framing.
Return a clean, realistic version of the same space with bare walls ready for new artwork.`;

type ImageMime = { mime: string; ext: string };

function guessMimeFromUri(uri: string): ImageMime {
  const lower = uri.split('?')[0].toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }
  if (lower.endsWith('.webp')) {
    return { mime: 'image/webp', ext: 'webp' };
  }
  if (lower.endsWith('.heic') || lower.endsWith('.heif')) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }
  return { mime: 'image/png', ext: 'png' };
}

function mimeToExt(mime: string): string {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  return 'png';
}

/** React Native FormData file part (iOS/Android). */
function appendNativeImage(formData: FormData, uri: string) {
  const { mime, ext } = guessMimeFromUri(uri);
  formData.append('image', {
    uri,
    type: mime,
    name: `room.${ext}`,
  } as unknown as Blob);
}

/** Web: build Blob via fetch (avoid ArrayBuffer → Blob, unsupported on RN). */
async function appendWebImage(formData: FormData, source: string) {
  const response = await fetch(source);
  const blob = await response.blob();
  const ext = mimeToExt(blob.type || 'image/png');
  formData.append('image', blob, `room.${ext}`);
}

async function buildCleanupFormData(imageSource: string): Promise<FormData> {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    await appendWebImage(formData, imageSource);
  } else {
    appendNativeImage(formData, imageSource);
  }

  formData.append('prompt', CLEANUP_PROMPT);
  formData.append('model', 'gpt-image-1');
  formData.append('n', '1');
  formData.append('size', CLEANUP_IMAGE_SIZE);

  return formData;
}

/**
 * @param imageSource Local file URI (iOS/Android) or data URL / blob URL (web)
 */
export async function cleanupRoomImage(
  imageSource: string,
  apiKey: string
): Promise<string> {
  const formData = await buildCleanupFormData(imageSource);

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'AI cleanup failed');
  }

  const data = await response.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error('No image returned from API');

  return `data:image/png;base64,${b64}`;
}
