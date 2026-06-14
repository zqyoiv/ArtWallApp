// utils/openai.ts
// Room cleanup using OpenAI GPT-Image-1 inpainting
// Artwork layout suggestions using OpenAI Vision

import { Platform } from 'react-native';
import { uriToDataUrl } from './imageUtils';
import { normalizeImageForOpenAI } from './normalizeImage';
import { AiLayoutSuggestion, parseAiLayoutSuggestion } from './placementLayout';

const OPENAI_API_URL = 'https://api.openai.com/v1/images/edits';
const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';

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

async function buildCleanupFormData(imageSource: string): Promise<FormData> {
  const formData = new FormData();
  const normalizedSource = await normalizeImageForOpenAI(imageSource);

  if (Platform.OS === 'web') {
    await appendWebImage(formData, normalizedSource);
  } else {
    appendNativeImage(formData, normalizedSource);
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

const LAYOUT_SYSTEM_PROMPT = `You are an interior design assistant. Your job is to suggest where to hang ONE artwork on the background wall in a cleaned room photo.

The room image is a 16:9 landscape preview after cleanup (clutter and existing wall art removed). Furniture, flooring, windows, and architecture remain.

TASK
Based on the uploaded artwork's aspect ratio (width ÷ height), choose a layout that hangs the artwork on the background wall so the furnished room looks visually balanced and beautiful.

CRITICAL RULES — follow in order:
1. BACKGROUND WALL ONLY: Place the artwork on the rear background wall — the main wall behind or above the furniture, not in front of it. Do NOT float the artwork in the middle of the room or over the floor.
2. NEVER BLOCK FURNITURE: The artwork must sit entirely on empty wall space. It must NOT overlap, cover, or occlude ANY furniture (sofas, chairs, tables, beds, shelves, lamps, etc.). If furniture occupies the center of the frame, do NOT place the artwork at the image center — shift it to clear wall area above, beside, or between furniture.
3. MODERATE SPACING: Keep a modest, natural gap between the artwork and nearby furniture — close enough to feel connected to the room, but never touching or overlapping. Aim for typical gallery hanging distance (roughly one hand-width to forearm-length above sofa backs or headboards). Do not place the artwork flush against furniture edges, and do not push it unnecessarily high or far away from the furniture below.
4. RESPECT ASPECT RATIO: Size and proportions must match the artwork orientation (portrait, landscape, or square). Use widthFraction so the framed artwork looks natural on that wall.
5. VISUAL BALANCE: Prefer eye-level or slightly above on the background wall, aligned with the room's focal wall. The composition should feel intentional — not dead-center unless the wall there is truly empty.

Before returning coordinates, mentally identify: (a) which wall is the background wall, (b) where furniture sits, (c) the largest clear wall rectangle that avoids all furniture.

Respond with JSON only:
{
  "centerX": number,       // artwork center, 0=left edge, 1=right edge of the 16:9 canvas
  "centerY": number,       // artwork center, 0=top edge, 1=bottom edge of the 16:9 canvas
  "widthFraction": number, // artwork width as fraction of canvas width (typical 0.10–0.32)
  "rotation": number       // radians; use 0 unless wall perspective clearly requires a slight tilt
}`;

type SuggestArtworkLayoutParams = {
  roomUri: string;
  artworkUri?: string | null;
  artworkAspectRatio: number;
  artworkDescription?: string;
  apiKey: string;
};

export async function suggestArtworkLayout(
  params: SuggestArtworkLayoutParams
): Promise<AiLayoutSuggestion> {
  const { roomUri, artworkUri, artworkAspectRatio, artworkDescription, apiKey } = params;

  const roomDataUrl = await uriToDataUrl(roomUri);
  const userContent: Array<
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string; detail: 'low' | 'high' } }
  > = [
    {
      type: 'text',
      text: `Artwork aspect ratio (width/height): ${artworkAspectRatio.toFixed(3)}.${
        artworkDescription ? ` ${artworkDescription}` : ''
      } Find a suitable layout to hang this artwork on the background wall in the cleaned room. It must stay on the background wall only, must not block any furniture, should keep moderate spacing from nearby furniture (not touching, but not too far away), and the overall scene should look balanced and aesthetically pleasing.`,
    },
    { type: 'image_url', image_url: { url: roomDataUrl, detail: 'high' } },
  ];

  if (artworkUri) {
    const artworkDataUrl = await uriToDataUrl(artworkUri);
    userContent.splice(1, 0, {
      type: 'image_url',
      image_url: { url: artworkDataUrl, detail: 'low' },
    });
  }

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
        { role: 'system', content: LAYOUT_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'AI layout suggestion failed');
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No layout suggestion returned from API');

  return parseAiLayoutSuggestion(JSON.parse(content));
}
