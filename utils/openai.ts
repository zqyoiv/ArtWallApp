// utils/openai.ts
// Room cleanup using OpenAI GPT Image edits
// Blank-wall dimension estimates using OpenAI Vision

import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { getImageDimensions, uriToDataUrl } from './imageUtils';
import { normalizeImageForOpenAI } from './normalizeImage';
import { parseWallEstimate, WallEstimate } from './dimensions';

const OPENAI_API_URL = 'https://api.openai.com/v1/images/edits';
const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';

/** Prefer gpt-image-2 HD; fall back to gpt-image-1 fixed sizes if unavailable. */
type GptImage1Size = '1024x1024' | '1536x1024' | '1024x1536';

const CLEANUP_PROMPT = `Remove all clutter, loose objects, cables, boxes, and miscellaneous household items from this room.
Also remove every item on the walls: paintings, framed art, posters, prints, wall decor, mirrors, shelves with objects, and any other wall-mounted visuals.
Leave all wall surfaces completely blank and empty—plain painted or textured walls only, with no artwork or decorations remaining.
Preserve furniture, flooring, windows, doors, architectural elements, lighting, colors, shadows, and room perspective.
Do not redesign the room or change its layout.
Keep the original camera framing and aspect ratio — do not crop, stretch, letterbox, or recompose the photo.
Return a clean, realistic version of the same space with bare walls ready for new artwork.`;

type ImageMime = { mime: string; ext: string };

/** Legacy gpt-image-1 sizes. */
export function gptImage1SizeForAspect(aspectRatio: number): GptImage1Size {
  if (aspectRatio >= 1.25) return '1536x1024';
  if (aspectRatio <= 0.8) return '1024x1536';
  return '1024x1024';
}

/**
 * gpt-image-2 custom size: match source aspect, target ~2560 long edge (2K / HD+).
 * Width & height must be multiples of 16; aspect within 1:3–3:1; pixels ≤ 8,294,400.
 */
export function gptImage2SizeForSource(width: number, height: number): string {
  const srcW = Math.max(1, width);
  const srcH = Math.max(1, height);
  let aspect = srcW / srcH;
  aspect = Math.min(3, Math.max(1 / 3, aspect));

  const TARGET_LONG = 2560;
  let outW: number;
  let outH: number;
  if (aspect >= 1) {
    outW = TARGET_LONG;
    outH = Math.round(TARGET_LONG / aspect);
  } else {
    outH = TARGET_LONG;
    outW = Math.round(TARGET_LONG * aspect);
  }

  const round16 = (n: number) => Math.max(16, Math.round(n / 16) * 16);
  outW = round16(outW);
  outH = round16(outH);

  const MAX_PIXELS = 8_294_400;
  const MIN_PIXELS = 655_360;
  let pixels = outW * outH;
  if (pixels > MAX_PIXELS) {
    const shrink = Math.sqrt(MAX_PIXELS / pixels);
    outW = round16(outW * shrink);
    outH = round16(outH * shrink);
    pixels = outW * outH;
  }
  if (pixels < MIN_PIXELS) {
    const grow = Math.sqrt(MIN_PIXELS / Math.max(1, pixels));
    outW = round16(outW * grow);
    outH = round16(outH * grow);
  }

  const maxEdge = Math.max(outW, outH);
  if (maxEdge >= 3840) {
    const shrink = 3824 / maxEdge;
    outW = round16(outW * shrink);
    outH = round16(outH * shrink);
  }

  return `${outW}x${outH}`;
}

/** Center-crop so the result matches the source photo's aspect ratio (lossless PNG). */
async function matchSourceAspect(imageUri: string, targetAspect: number): Promise<string> {
  const { width, height } = await getImageDimensions(imageUri);
  if (width <= 0 || height <= 0) return imageUri;

  const currentAspect = width / height;
  if (Math.abs(currentAspect - targetAspect) < 0.02) {
    return imageUri;
  }

  let crop: { originX: number; originY: number; width: number; height: number };
  if (currentAspect > targetAspect) {
    const cropWidth = Math.round(height * targetAspect);
    crop = {
      originX: Math.max(0, Math.round((width - cropWidth) / 2)),
      originY: 0,
      width: Math.min(cropWidth, width),
      height,
    };
  } else {
    const cropHeight = Math.round(width / targetAspect);
    crop = {
      originX: 0,
      originY: Math.max(0, Math.round((height - cropHeight) / 2)),
      width,
      height: Math.min(cropHeight, height),
    };
  }

  // Web: crop via createImageBitmap + canvas so we keep full pixel fidelity
  // (expo-image-manipulator uses HTMLImageElement which can share a downscaled decode).
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const bitmap =
        typeof createImageBitmap === 'function'
          ? await createImageBitmap(blob)
          : null;
      if (bitmap) {
        const canvas = document.createElement('canvas');
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            bitmap,
            crop.originX,
            crop.originY,
            crop.width,
            crop.height,
            0,
            0,
            crop.width,
            crop.height
          );
          bitmap.close();
          const outBlob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, 'image/png')
          );
          if (outBlob) {
            return URL.createObjectURL(outBlob);
          }
        } else {
          bitmap.close();
        }
      }
    } catch {
      // Fall through to ImageManipulator.
    }
  }

  const result = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ crop }],
    { compress: 1, format: ImageManipulator.SaveFormat.PNG }
  );
  return result.uri;
}

function guessMimeFromUri(uri: string): ImageMime {
  const lower = uri.split('?')[0].toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }
  if (lower.endsWith('.webp')) {
    return { mime: 'image/webp', ext: 'webp' };
  }
  if (lower.endsWith('.gif')) {
    return { mime: 'image/gif', ext: 'gif' };
  }
  return { mime: 'image/jpeg', ext: 'jpg' };
}

function mimeToExt(mime: string): string {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
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
  const ext = mimeToExt(blob.type || 'image/jpeg');
  formData.append('image', blob, `room.${ext}`);
}

async function buildCleanupFormData(
  normalizedSource: string,
  model: string,
  size: string,
  quality?: string
): Promise<FormData> {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    await appendWebImage(formData, normalizedSource);
  } else {
    appendNativeImage(formData, normalizedSource);
  }

  formData.append('prompt', CLEANUP_PROMPT);
  formData.append('model', model);
  formData.append('n', '1');
  formData.append('size', size);
  if (quality) {
    formData.append('quality', quality);
  }

  return formData;
}

async function postImageEdit(formData: FormData, apiKey: string): Promise<string> {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message =
      (error as { error?: { message?: string } })?.error?.message || 'AI cleanup failed';
    throw new Error(message);
  }

  const data = await response.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error('No image returned from API');
  return `data:image/png;base64,${b64}`;
}

/**
 * @param imageSource Local file URI (iOS/Android) or data URL / blob URL (web)
 */
export async function cleanupRoomImage(
  imageSource: string,
  apiKey: string
): Promise<string> {
  const normalizedSource = await normalizeImageForOpenAI(imageSource);
  const { width, height } = await getImageDimensions(normalizedSource);
  const sourceAspect = width > 0 && height > 0 ? width / height : 16 / 9;
  const hdSize = gptImage2SizeForSource(width || 1920, height || 1080);

  // Prefer gpt-image-2 at ~2K so the cleaned room matches artwork sharpness.
  try {
    const formData = await buildCleanupFormData(
      normalizedSource,
      'gpt-image-2',
      hdSize,
      'high'
    );
    const generated = await postImageEdit(formData, apiKey);
    return matchSourceAspect(generated, sourceAspect);
  } catch {
    // Fall back to gpt-image-1 fixed sizes if gpt-image-2 isn't available on this key.
    const legacySize = gptImage1SizeForAspect(sourceAspect);
    const formData = await buildCleanupFormData(
      normalizedSource,
      'gpt-image-1',
      legacySize
    );
    const generated = await postImageEdit(formData, apiKey);
    return matchSourceAspect(generated, sourceAspect);
  }
}

const WALL_DIMENSION_PROMPT = `You are an interior measurement assistant. Look at this room photo and estimate the blank wall area suitable for hanging artwork — typically the open wall space above a sofa, bed, console, or other furniture on the main background wall.

Return a realistic inch estimate (approximate is fine) for that blank wall rectangle, plus where it sits in the photo.

Respond with JSON only:
{
  "widthInches": number,           // estimated blank wall width in inches
  "heightInches": number,          // estimated blank wall height in inches
  "regionWidthFraction": number,   // blank wall width as fraction of the full image width (0–1)
  "regionHeightFraction": number   // blank wall height as fraction of the full image height (0–1)
}

Use furniture scale cues (sofa ~72–84" wide, seat height ~17–19", typical ceiling ~96") when estimating. Prefer the largest continuous blank wall region above/behind furniture, not side walls.`;

/**
 * Estimate blank-wall physical size (inches) and on-canvas region from a room photo.
 * Intended to run in parallel with cleanup.
 */
export async function estimateBlankWallDimensions(
  imageSource: string,
  apiKey: string
): Promise<WallEstimate> {
  const imageDataUrl = await uriToDataUrl(imageSource);

  const response = await fetch(OPENAI_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: WALL_DIMENSION_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Estimate the blank wall dimensions (inches) above the main furniture on the background wall.',
            },
            { type: 'image_url', image_url: { url: imageDataUrl, detail: 'high' } },
          ],
        },
      ],
      max_tokens: 250,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Wall dimension estimate failed');
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No wall dimensions returned from API');

  return parseWallEstimate(JSON.parse(content));
}
